import { db } from "../server/db";
import { riddles } from "@shared/schema";
import { and, eq, inArray, not } from "drizzle-orm";

// This script checks for and removes duplicate riddles from the database

async function cleanDuplicateRiddles() {
  try {
    console.log("🧹 Starting duplicate riddle cleanup...");
    
    // Get all riddles
    const allRiddles = await db.select().from(riddles);
    console.log(`Found ${allRiddles.length} total riddles in the database.`);
    
    // Track duplicates by question and answer
    const questionMap = new Map();
    const answerMap = new Map();
    const duplicateIds = new Set<number>();
    
    // Find duplicates
    for (const riddle of allRiddles) {
      const questionKey = riddle.question.toLowerCase().trim();
      const answerKey = riddle.answer.toLowerCase().trim();
      
      // Check for duplicate questions
      if (questionMap.has(questionKey)) {
        // Keep the older record (lower ID) and mark the newer one for deletion
        const existingId = questionMap.get(questionKey);
        const idToRemove = Math.max(existingId, riddle.id);
        duplicateIds.add(idToRemove);
        console.log(`Found duplicate question: "${riddle.question.substring(0, 30)}..." (IDs: ${existingId}, ${riddle.id})`);
      } else {
        questionMap.set(questionKey, riddle.id);
      }
      
      // Check for duplicate answers
      if (answerMap.has(answerKey) && answerKey.length > 2) { // Only check substantial answers
        // If this is in the same category as the existing one with the same answer, it's a duplicate
        const existingRiddle = allRiddles.find(r => r.id === answerMap.get(answerKey));
        if (existingRiddle && existingRiddle.categoryId === riddle.categoryId) {
          const existingId = answerMap.get(answerKey);
          const idToRemove = Math.max(existingId, riddle.id);
          duplicateIds.add(idToRemove);
          console.log(`Found duplicate answer: "${riddle.answer}" in same category (IDs: ${existingId}, ${riddle.id})`);
        }
      } else {
        answerMap.set(answerKey, riddle.id);
      }
    }
    
    // Convert Set to Array for deletion
    const idsToDelete = Array.from(duplicateIds);
    console.log(`Found ${idsToDelete.length} duplicate riddles to remove.`);
    
    if (idsToDelete.length > 0) {
      // Remove duplicates
      const result = await db.delete(riddles).where(inArray(riddles.id, idsToDelete));
      console.log(`Successfully removed ${idsToDelete.length} duplicate riddles.`);
    } else {
      console.log("No duplicates found. Database is clean!");
    }
    
    // Final count
    const remainingRiddles = await db.select().from(riddles);
    console.log(`Database now contains ${remainingRiddles.length} unique riddles.`);
    
    console.log("✅ Duplicate riddle cleanup completed successfully!");
  } catch (error) {
    console.error("Error during duplicate riddle cleanup:", error);
  }
}

// Run the script
cleanDuplicateRiddles().catch(console.error).finally(() => process.exit(0));
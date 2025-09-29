import { db } from "../server/db";
import { InsertRiddle, categories, riddles } from "@shared/schema";
import { eq } from "drizzle-orm";

// This script uses the Perplexity API to generate emoji puzzles
// for different categories like movies, TV shows, foods, etc.

async function callPerplexityAPI(prompt: string): Promise<any> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating emoji puzzles where combinations of emojis represent well-known concepts, titles, or phrases."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    throw error;
  }
}

async function getOrCreateEmojiCategory(name: string, colorClass: string): Promise<number> {
  // Check if the category already exists
  const existingCategory = await db.select().from(categories).where(eq(categories.name, name));
  
  if (existingCategory.length > 0) {
    return existingCategory[0].id;
  }
  
  // Create the category if it doesn't exist
  const [newCategory] = await db.insert(categories).values({
    name,
    description: `Emoji puzzles representing ${name.toLowerCase()}`,
    colorClass
  }).returning();
  
  console.log(`Created new category: ${name} with ID ${newCategory.id}`);
  return newCategory.id;
}

async function generateEmojiPuzzles(categoryName: string, emojiType: string, count: number): Promise<InsertRiddle[]> {
  console.log(`Generating ${count} emoji puzzles for ${emojiType}...`);

  // Define colorClass based on emojiType
  let colorClass = "primary";
  switch (emojiType.toLowerCase()) {
    case "movies":
      colorClass = "primary";
      break;
    case "tv-shows":
      colorClass = "secondary";
      break;
    case "foods":
      colorClass = "success";
      break;
    case "household-items":
      colorClass = "warning";
      break;
    case "places":
      colorClass = "accent";
      break;
    default:
      colorClass = "primary";
  }

  // Get or create the category
  const categoryId = await getOrCreateEmojiCategory(categoryName, colorClass);

  // Get existing emoji puzzles for this category to avoid duplicates
  const existingPuzzles = await db.select().from(riddles).where(eq(riddles.categoryId, categoryId));
  const existingQuestions = new Set(existingPuzzles.map(r => r.question.toLowerCase()));
  const existingAnswers = new Set(existingPuzzles.map(r => r.answer.toLowerCase()));

  console.log(`Found ${existingPuzzles.length} existing emoji puzzles for ${emojiType}.`);

  // Define difficulty distribution
  const difficulties = ["easy", "medium", "hard", "extreme"];
  
  // Batch size for API calls
  const batchSize = 10;
  const generatedPuzzles: InsertRiddle[] = [];

  try {
    // Generate emoji puzzles in batches
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      console.log(`Generating batch ${i/batchSize + 1} (${batchCount} emoji puzzles)...`);

      // Craft the prompt based on the emoji type
      let prompt = `Create ${batchCount} unique emoji puzzles for ${emojiType}. For each puzzle, provide:
      1. The emoji sequence (question)
      2. The answer (what the emojis represent)
      3. A hint to help solve it
      4. An explanation of how the emojis represent the answer
      5. A difficulty rating (easy, medium, hard, or extreme)

      Format your response as a JSON array of objects with these fields. Make sure none of the puzzles are duplicates or too similar to each other. The emoji sequences should be clever and intuitive combinations that represent well-known ${emojiType.toLowerCase()}.`;

      // Call Perplexity API
      const response = await callPerplexityAPI(prompt);
      const content = JSON.parse(response.choices[0].message.content);

      // Process and validate the generated emoji puzzles
      if (Array.isArray(content)) {
        for (const item of content) {
          // Skip if missing required fields
          if (!item.question || !item.answer || !item.hint || !item.explanation || !item.difficulty) {
            console.warn("Skipping emoji puzzle with missing fields:", item);
            continue;
          }

          // Skip duplicates
          if (existingQuestions.has(item.question.toLowerCase()) || 
              generatedPuzzles.some(r => r.question.toLowerCase() === item.question.toLowerCase())) {
            console.warn("Skipping duplicate emoji sequence:", item.question);
            continue;
          }

          // Skip if we already have very similar answers
          if (existingAnswers.has(item.answer.toLowerCase()) || 
              generatedPuzzles.some(r => r.answer.toLowerCase() === item.answer.toLowerCase())) {
            console.warn("Skipping emoji puzzle with duplicate answer:", item.answer);
            continue;
          }

          // Validate and normalize the difficulty
          let difficulty = item.difficulty.toLowerCase();
          if (!difficulties.includes(difficulty)) {
            difficulty = "medium"; // Default to medium if invalid
          }

          // Create the emoji puzzle object
          const newPuzzle: InsertRiddle = {
            question: item.question,
            answer: item.answer,
            hint: item.hint,
            explanation: item.explanation,
            categoryId,
            difficulty,
            avgSolveTimeSeconds: 0
          };

          generatedPuzzles.push(newPuzzle);
          existingQuestions.add(item.question.toLowerCase());
          existingAnswers.add(item.answer.toLowerCase());
        }
      } else {
        console.error("API did not return an array of emoji puzzles:", content);
      }

      console.log(`Generated ${generatedPuzzles.length} unique emoji puzzles so far.`);

      // Add a delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return generatedPuzzles;
  } catch (error) {
    console.error(`Error generating emoji puzzles for ${emojiType}:`, error);
    return generatedPuzzles; // Return what we have so far
  }
}

async function generateAllEmojiPuzzles() {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("PERPLEXITY_API_KEY environment variable is required.");
    process.exit(1);
  }

  try {
    // Define emoji puzzle categories to generate
    const emojiCategories = [
      { name: "Emoji Movies", type: "movies", count: 200 },
      { name: "Emoji TV Shows", type: "tv-shows", count: 200 },
      { name: "Emoji Foods", type: "foods", count: 200 },
      { name: "Emoji Household Items", type: "household-items", count: 200 },
      { name: "Emoji Places", type: "places", count: 200 }
    ];
    
    // Generate puzzles for each category
    for (const category of emojiCategories) {
      const generatedPuzzles = await generateEmojiPuzzles(
        category.name,
        category.type,
        category.count
      );
      
      console.log(`Generated ${generatedPuzzles.length} new emoji puzzles for ${category.name}.`);
      
      // Insert the generated puzzles in batches
      const batchSize = 50;
      for (let i = 0; i < generatedPuzzles.length; i += batchSize) {
        const batch = generatedPuzzles.slice(i, i + batchSize);
        if (batch.length > 0) {
          await db.insert(riddles).values(batch);
          console.log(`Inserted batch ${i/batchSize + 1}/${Math.ceil(generatedPuzzles.length/batchSize)}`);
        }
      }
    }
    
    console.log("✅ All emoji puzzles generated and saved successfully!");
  } catch (error) {
    console.error("Error in emoji puzzle generation process:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
generateAllEmojiPuzzles().catch(console.error);
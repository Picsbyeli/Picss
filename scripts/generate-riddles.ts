import { db } from "../server/db";
import { InsertRiddle, categories, riddles } from "@shared/schema";
import { eq } from "drizzle-orm";

// This script uses the Perplexity API to generate riddles for each category
// and stores them in the database. Each category will have 200 unique riddles.

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
            content: "You are an expert riddle creator specializing in creating unique, challenging, and engaging riddles."
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

async function generateRiddlesForCategory(categoryId: number, categoryName: string, count: number): Promise<InsertRiddle[]> {
  console.log(`Generating ${count} riddles for category: ${categoryName}...`);

  // Define difficulty distribution
  const difficulties = ["easy", "medium", "hard"];
  const difficultyDistribution = {
    easy: 0.4, // 40% easy
    medium: 0.4, // 40% medium
    hard: 0.2 // 20% hard
  };

  // Get existing riddles for this category to avoid duplicates
  const existingRiddles = await db.select().from(riddles).where(eq(riddles.categoryId, categoryId));
  const existingQuestions = new Set(existingRiddles.map(r => r.question.toLowerCase()));
  const existingAnswers = new Set(existingRiddles.map(r => r.answer.toLowerCase()));

  console.log(`Found ${existingRiddles.length} existing riddles for this category.`);

  // Determine how many new riddles we need to generate
  const newRiddlesToGenerate = count;
  const batchSize = 10; // Generate 10 riddles per API call to be efficient
  const generatedRiddles: InsertRiddle[] = [];

  try {
    // Generate riddles in batches
    for (let i = 0; i < newRiddlesToGenerate; i += batchSize) {
      const batchCount = Math.min(batchSize, newRiddlesToGenerate - i);
      console.log(`Generating batch ${i/batchSize + 1} (${batchCount} riddles)...`);

      // Craft a prompt based on the category
      let prompt = "";
      switch (categoryName) {
        case "Logic Puzzles":
          prompt = `Create ${batchCount} unique, challenging logic puzzles and riddles that test deductive reasoning. For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. Make sure none of the riddles are common or well-known, and avoid wordplay riddles or math puzzles. Ensure the riddles have genuine logical solutions.`;
          break;
        case "Word Riddles":
          prompt = `Create ${batchCount} unique, clever word riddles that play with language, homonyms, and double meanings. For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. Make sure none of the riddles are common or well-known clichés. Focus on linguistic creativity.`;
          break;
        case "Math Puzzles":
          prompt = `Create ${batchCount} unique, engaging mathematical puzzles and riddles. For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. Include various levels of difficulty and different types of math (arithmetic, algebra, geometry, etc.). The puzzles should be solvable without advanced math knowledge.`;
          break;
        case "Visual Puzzles":
          prompt = `Create ${batchCount} unique visual riddles described in text (not actual images). For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. These should be riddles that play with visual concepts, spatial reasoning, or describe visual patterns that the solver must imagine.`;
          break;
        case "Lateral Thinking":
          prompt = `Create ${batchCount} unique lateral thinking puzzles that require thinking outside the box. For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. These should be puzzles that challenge conventional reasoning and require creative solutions.`;
          break;
        case "EV Special":
          prompt = `Create ${batchCount} unique "guess what I am" type riddles where players need to figure out an object, person, place, or concept. For each riddle, provide a question with 4-5 clues, an answer, a hint, and an explanation. Format your response as a JSON array of objects with these fields. These are for a yes/no guessing game, so make them descriptive but not too obvious.`;
          break;
        default:
          prompt = `Create ${batchCount} unique, challenging riddles suitable for adults and teens. For each riddle, provide a question, answer, hint, and explanation. Format your response as a JSON array of objects with these fields. Make sure none of the riddles are common or well-known.`;
      }

      prompt += `\n\nFor each riddle, assign a difficulty (easy, medium, or hard). JSON format should be:
      [{
        "question": "Riddle text here",
        "answer": "The answer",
        "hint": "A helpful hint",
        "explanation": "Why the answer makes sense",
        "difficulty": "easy/medium/hard"
      }, ...]`;

      // Call Perplexity API
      const response = await callPerplexityAPI(prompt);
      const content = JSON.parse(response.choices[0].message.content);

      // Process and validate the generated riddles
      if (Array.isArray(content)) {
        for (const item of content) {
          // Skip if missing required fields
          if (!item.question || !item.answer || !item.hint || !item.explanation || !item.difficulty) {
            console.warn("Skipping riddle with missing fields:", item);
            continue;
          }

          // Skip duplicates
          if (existingQuestions.has(item.question.toLowerCase()) || 
              generatedRiddles.some(r => r.question.toLowerCase() === item.question.toLowerCase())) {
            console.warn("Skipping duplicate question:", item.question);
            continue;
          }

          // Skip if we already have very similar answers
          if (existingAnswers.has(item.answer.toLowerCase()) || 
              generatedRiddles.some(r => r.answer.toLowerCase() === item.answer.toLowerCase())) {
            console.warn("Skipping riddle with duplicate answer:", item.answer);
            continue;
          }

          // Convert difficulty to valid value if needed
          const difficulty = ["easy", "medium", "hard"].includes(item.difficulty.toLowerCase()) 
            ? item.difficulty.toLowerCase() 
            : "medium";

          // Create the riddle object
          const newRiddle: InsertRiddle = {
            question: item.question,
            answer: item.answer,
            hint: item.hint,
            explanation: item.explanation,
            categoryId,
            difficulty,
            avgSolveTimeSeconds: 0
          };

          generatedRiddles.push(newRiddle);
          existingQuestions.add(item.question.toLowerCase());
          existingAnswers.add(item.answer.toLowerCase());
        }
      } else {
        console.error("API did not return an array of riddles:", content);
      }

      console.log(`Generated ${generatedRiddles.length} unique riddles so far.`);

      // Add a delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return generatedRiddles;
  } catch (error) {
    console.error(`Error generating riddles for ${categoryName}:`, error);
    return generatedRiddles; // Return what we have so far
  }
}

async function generateRiddles() {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("PERPLEXITY_API_KEY environment variable is required.");
    process.exit(1);
  }

  try {
    // Get all categories
    const allCategories = await db.select().from(categories);
    
    // Define how many riddles we want per category
    const riddlesPerCategory = 200;
    
    // Loop through each category and generate riddles
    for (const category of allCategories) {
      const generatedRiddles = await generateRiddlesForCategory(
        category.id, 
        category.name, 
        riddlesPerCategory
      );
      
      console.log(`Generated ${generatedRiddles.length} new riddles for category ${category.name}.`);
      
      // Insert the generated riddles in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < generatedRiddles.length; i += batchSize) {
        const batch = generatedRiddles.slice(i, i + batchSize);
        if (batch.length > 0) {
          await db.insert(riddles).values(batch);
          console.log(`Inserted batch ${i/batchSize + 1}/${Math.ceil(generatedRiddles.length/batchSize)}`);
        }
      }
    }
    
    console.log("✅ All riddles generated and saved successfully!");
  } catch (error) {
    console.error("Error in riddle generation process:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
generateRiddles().catch(console.error);
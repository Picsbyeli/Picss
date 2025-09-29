import { db } from "../server/db";
import { InsertRiddle, categories, riddles } from "@shared/schema";
import { eq } from "drizzle-orm";

// This script uses the Perplexity API to generate word lists for the Burble game
// organized by word length (4, 5, 6, 7, and 8 letters)

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
            content: "You are an expert lexicographer with knowledge of common words appropriate for word games."
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

async function getOrCreateBurbleCategory(wordLength: number): Promise<number> {
  const categoryName = `Burble ${wordLength}-Letter Words`;
  
  // Check if the category already exists
  const existingCategory = await db.select().from(categories).where(eq(categories.name, categoryName));
  
  if (existingCategory.length > 0) {
    return existingCategory[0].id;
  }
  
  // Define color class based on word length
  let colorClass = "primary";
  switch (wordLength) {
    case 4:
      colorClass = "success";
      break;
    case 5:
      colorClass = "primary";
      break;
    case 6:
      colorClass = "secondary";
      break;
    case 7:
      colorClass = "accent";
      break;
    case 8:
      colorClass = "warning";
      break;
    default:
      colorClass = "primary";
  }
  
  // Create the category if it doesn't exist
  const [newCategory] = await db.insert(categories).values({
    name: categoryName,
    description: `Words with ${wordLength} letters for the Burble game`,
    colorClass
  }).returning();
  
  console.log(`Created new category: ${categoryName} with ID ${newCategory.id}`);
  return newCategory.id;
}

async function generateWordList(wordLength: number, count: number): Promise<InsertRiddle[]> {
  console.log(`Generating ${count} ${wordLength}-letter words for Burble...`);

  // Get or create the category
  const categoryId = await getOrCreateBurbleCategory(wordLength);

  // Get existing words for this category to avoid duplicates
  const existingWords = await db.select().from(riddles).where(eq(riddles.categoryId, categoryId));
  const existingAnswers = new Set(existingWords.map(r => r.answer.toLowerCase()));

  console.log(`Found ${existingWords.length} existing ${wordLength}-letter words.`);

  // Batch size for API calls
  const batchSize = 50; // We can get more words per batch since they're simpler
  const generatedWords: InsertRiddle[] = [];

  // Assign difficulty based on word length
  let difficulty: string;
  switch (wordLength) {
    case 4:
      difficulty = "easy";
      break;
    case 5:
    case 6:
      difficulty = "medium";
      break;
    case 7:
    case 8:
      difficulty = "hard";
      break;
    default:
      difficulty = "medium";
  }

  try {
    // Generate words in batches
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i);
      console.log(`Generating batch ${i/batchSize + 1} (${batchCount} words)...`);

      // Craft the prompt for word generation
      const prompt = `Generate ${batchCount} common ${wordLength}-letter words for a word guessing game similar to Wordle. 
      The words should be:
      - Exactly ${wordLength} letters long
      - Common English words that most people would know
      - Nouns, verbs, adjectives, or adverbs (no proper nouns, abbreviations, or slang)
      - Single words (no phrases or hyphenated words)
      - Appropriate for all ages

      Format your response as a JSON array of objects, where each object has:
      - "word": the ${wordLength}-letter word
      - "definition": a short, clear definition
      - "exampleSentence": a simple example sentence using the word

      Ensure there are no duplicates in your list.`;

      // Call Perplexity API
      const response = await callPerplexityAPI(prompt);
      const content = JSON.parse(response.choices[0].message.content);

      // Process and validate the generated words
      if (Array.isArray(content)) {
        for (const item of content) {
          // Skip if missing required fields
          if (!item.word) {
            console.warn("Skipping item with missing word:", item);
            continue;
          }

          // Clean up the word and ensure it's the right length
          const word = item.word.trim().toLowerCase();
          if (word.length !== wordLength) {
            console.warn(`Skipping word with incorrect length: ${word}`);
            continue;
          }

          // Skip duplicates
          if (existingAnswers.has(word) || 
              generatedWords.some(r => r.answer.toLowerCase() === word)) {
            console.warn(`Skipping duplicate word: ${word}`);
            continue;
          }

          // Ensure we have a definition and example sentence
          const definition = item.definition || `A ${wordLength}-letter word.`;
          const exampleSentence = item.exampleSentence || `The word "${word}" has ${wordLength} letters.`;

          // Create the riddle object (for Burble, we'll store the word as the answer)
          const newWord: InsertRiddle = {
            question: `This ${wordLength}-letter word means: ${definition}`,
            answer: word,
            hint: `Example: ${exampleSentence}`,
            explanation: `The word "${word}" is a ${wordLength}-letter word meaning: ${definition}`,
            categoryId,
            difficulty,
            avgSolveTimeSeconds: 0
          };

          generatedWords.push(newWord);
          existingAnswers.add(word);
        }
      } else {
        console.error("API did not return an array of words:", content);
      }

      console.log(`Generated ${generatedWords.length} unique ${wordLength}-letter words so far.`);

      // Add a delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return generatedWords;
  } catch (error) {
    console.error(`Error generating ${wordLength}-letter words:`, error);
    return generatedWords; // Return what we have so far
  }
}

async function generateAllBurbleWords() {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("PERPLEXITY_API_KEY environment variable is required.");
    process.exit(1);
  }

  try {
    // Define word lengths and counts to generate
    const wordConfigs = [
      { length: 4, count: 200 },
      { length: 5, count: 200 },
      { length: 6, count: 200 },
      { length: 7, count: 200 },
      { length: 8, count: 200 }
    ];
    
    // Generate words for each length
    for (const config of wordConfigs) {
      const generatedWords = await generateWordList(
        config.length,
        config.count
      );
      
      console.log(`Generated ${generatedWords.length} new ${config.length}-letter words.`);
      
      // Insert the generated words in batches
      const batchSize = 50;
      for (let i = 0; i < generatedWords.length; i += batchSize) {
        const batch = generatedWords.slice(i, i + batchSize);
        if (batch.length > 0) {
          await db.insert(riddles).values(batch);
          console.log(`Inserted batch ${i/batchSize + 1}/${Math.ceil(generatedWords.length/batchSize)}`);
        }
      }
    }
    
    console.log("✅ All Burble words generated and saved successfully!");
  } catch (error) {
    console.error("Error in Burble word generation process:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
generateAllBurbleWords().catch(console.error);
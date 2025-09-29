import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// This script runs all content generators in sequence to prevent
// API rate limits and database contention

async function runScript(scriptPath: string): Promise<void> {
  console.log(`\n🚀 Running ${scriptPath}...\n`);
  
  try {
    const { stdout, stderr } = await execAsync(`NODE_ENV=development npx tsx ${scriptPath}`);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`\n✅ Successfully completed ${scriptPath}\n`);
  } catch (error) {
    console.error(`❌ Error running ${scriptPath}:`, error);
    throw error;
  }
}

async function generateAllContent() {
  try {
    console.log("=".repeat(80));
    console.log("STARTING CONTENT GENERATION");
    console.log("=".repeat(80));
    
    // Generate regular riddles for all categories
    await runScript('./scripts/generate-riddles.ts');
    
    // Generate emoji puzzles
    await runScript('./scripts/generate-emoji-puzzles.ts');
    
    // Generate words for Burble game
    await runScript('./scripts/generate-burble-words.ts');
    
    console.log("=".repeat(80));
    console.log("✅ ALL CONTENT GENERATED SUCCESSFULLY");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Error in content generation process:", error);
    process.exit(1);
  }
}

// Run the content generation
generateAllContent().catch(console.error);
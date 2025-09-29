import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("Connecting to the database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // Create tables for our schema
  console.log("Creating tables...");
  
  // Create users table
  console.log("Creating users table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      solved_count INTEGER NOT NULL DEFAULT 0,
      avg_time_seconds INTEGER NOT NULL DEFAULT 0
    )
  `);
  
  // Create categories table
  console.log("Creating categories table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color_class TEXT NOT NULL
    )
  `);
  
  // Create riddles table
  console.log("Creating riddles table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS riddles (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT,
      explanation TEXT,
      image_url TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      difficulty TEXT NOT NULL,
      avg_solve_time_seconds INTEGER DEFAULT 0,
      creator_name TEXT DEFAULT 'Anonymous',
      is_fan_made BOOLEAN DEFAULT FALSE
    )
  `);
  
  // Create user_progress table
  console.log("Creating user_progress table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      riddle_id INTEGER NOT NULL REFERENCES riddles(id),
      solved BOOLEAN NOT NULL DEFAULT FALSE,
      time_to_solve_seconds INTEGER,
      hints_used INTEGER DEFAULT 0,
      solved_at TIMESTAMP
    )
  `);
  
  // Create user_favorites table
  console.log("Creating user_favorites table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      riddle_id INTEGER NOT NULL REFERENCES riddles(id),
      added_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, riddle_id)
    )
  `);
  
  console.log("All tables created successfully!");
  
  await pool.end();
}

main().catch(err => {
  console.error('Error in migration:', err);
  process.exit(1);
});
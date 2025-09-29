import { db } from '../server/db';
import { categories, riddles } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addEmojiGuessCategory() {
  console.log('Adding Emoji Guess category and puzzles...');
  
  // Check if category already exists
  const existingCategory = await db.query.categories.findFirst({
    where: eq(categories.name, 'Emoji Guess')
  });
  
  let categoryId: number;
  
  if (existingCategory) {
    console.log('Emoji Guess category already exists');
    categoryId = existingCategory.id;
  } else {
    // Create new category
    const [newCategory] = await db.insert(categories).values({
      name: 'Emoji Guess',
      description: 'Guess the movie, food, or item based on emoji combinations',
      colorClass: 'bg-gradient-to-r from-yellow-400 to-purple-500'
    }).returning();
    
    categoryId = newCategory.id;
    console.log(`Created Emoji Guess category with ID: ${categoryId}`);
  }
  
  // Sample emoji puzzles
  const emojiPuzzles = [
    // Easy level
    {
      question: '🦇🧍‍♂️',
      answer: 'Batman',
      explanation: 'The puzzle shows a bat emoji and a man emoji, representing "Batman".',
      hint: 'A superhero who dresses like a nocturnal animal',
      difficulty: 'easy',
      categoryId
    },
    {
      question: '🏠👨‍👩‍👧‍👦🏡',
      answer: 'Home Alone',
      explanation: 'The puzzle shows a house, a family, and another house, representing the movie "Home Alone" where a boy is left alone at home.',
      hint: 'A Christmas movie about a forgotten child',
      difficulty: 'easy',
      categoryId
    },
    {
      question: '🍿🥤🎬',
      answer: 'Movie Theater',
      explanation: 'The puzzle shows popcorn, a drink, and a clapperboard, representing a "Movie Theater".',
      hint: 'A place where people go to watch films',
      difficulty: 'easy',
      categoryId
    },
    
    // Medium level
    {
      question: '🕷️🧍‍♂️',
      answer: 'Spider-Man',
      explanation: 'The puzzle shows a spider emoji and a man emoji, representing "Spider-Man".',
      hint: 'A superhero with the abilities of an arachnid',
      difficulty: 'medium',
      categoryId
    },
    {
      question: '⭐⚔️',
      answer: 'Star Wars',
      explanation: 'The puzzle shows stars and crossed swords (lightsabers), representing "Star Wars".',
      hint: 'A space opera with Jedi and the Force',
      difficulty: 'medium',
      categoryId
    },
    {
      question: '🧙‍♂️💍',
      answer: 'Lord of the Rings',
      explanation: 'The puzzle shows a wizard and a ring, representing "The Lord of the Rings".',
      hint: 'An epic fantasy about a powerful jewelry item',
      difficulty: 'medium',
      categoryId
    },
    
    // Hard level
    {
      question: '🦖🦕🏝️🏞️',
      answer: 'Jurassic Park',
      explanation: 'The puzzle shows dinosaurs and landscapes, representing "Jurassic Park".',
      hint: 'A theme park with prehistoric creatures',
      difficulty: 'hard',
      categoryId
    },
    {
      question: '🔎🐟',
      answer: 'Finding Nemo',
      explanation: 'The puzzle shows a magnifying glass and a fish, representing "Finding Nemo".',
      hint: 'An animated film about a father searching for his son underwater',
      difficulty: 'hard',
      categoryId
    },
    {
      question: '😱🔪🚿',
      answer: 'Psycho',
      explanation: 'The puzzle shows a scared face, a knife, and a shower, representing the horror movie "Psycho".',
      hint: 'A Hitchcock horror classic with a famous bathroom scene',
      difficulty: 'hard',
      categoryId
    },
    
    // Extreme level
    {
      question: '🌊👨‍👩‍👧🚢🧊💔',
      answer: 'Titanic',
      explanation: 'The puzzle shows water, people, a ship, ice, and a broken heart, representing "Titanic".',
      hint: 'A romantic disaster film about a famous shipwreck',
      difficulty: 'extreme',
      categoryId
    },
    {
      question: '🧠🔄👁️👨‍👩‍👧‍👦💭',
      answer: 'Inside Out',
      explanation: 'The puzzle shows a brain, cycling, an eye, a family, and thought bubbles, representing the animated film "Inside Out" which is about emotions inside a girl\'s mind.',
      hint: 'An animated film about emotions as characters inside someone\'s mind',
      difficulty: 'extreme',
      categoryId
    },
    {
      question: '🧪👨‍🔬☢️💚😡',
      answer: 'The Incredible Hulk',
      explanation: 'The puzzle shows test tubes, a scientist, radiation, green, and an angry face, representing "The Incredible Hulk".',
      hint: 'A superhero who turns green when angry',
      difficulty: 'extreme',
      categoryId
    },
    
    // Food category - Easy
    {
      question: '🧀🍅🍞',
      answer: 'Grilled Cheese Sandwich',
      explanation: 'The puzzle shows cheese, tomato, and bread, representing a "Grilled Cheese Sandwich".',
      hint: 'A popular comfort food made with dairy between toasted bread',
      difficulty: 'easy',
      categoryId
    },
    
    // Food category - Medium
    {
      question: '🥚🥓🧀🍳',
      answer: 'Breakfast',
      explanation: 'The puzzle shows egg, bacon, cheese, and a frying pan, representing "Breakfast".',
      hint: 'The first meal of the day',
      difficulty: 'medium',
      categoryId
    },
    
    // Food category - Hard
    {
      question: '🇮🇹🍝🍷🍞',
      answer: 'Italian Dinner',
      explanation: 'The puzzle shows the Italian flag, pasta, wine, and bread, representing an "Italian Dinner".',
      hint: 'A Mediterranean meal featuring pasta',
      difficulty: 'hard',
      categoryId
    },
    
    // Items category
    {
      question: '📱💻⌚️',
      answer: 'Apple Devices',
      explanation: 'The puzzle shows a smartphone, laptop, and smartwatch, representing "Apple Devices".',
      hint: 'Electronic products from a company with a fruit name',
      difficulty: 'medium',
      categoryId
    }
  ];
  
  // Insert puzzles, ignoring duplicates (a basic approach)
  for (const puzzleData of emojiPuzzles) {
    // Check if the puzzle already exists
    const existingPuzzle = await db.query.riddles.findFirst({
      where: eq(riddles.question, puzzleData.question)
    });
    
    if (existingPuzzle) {
      console.log(`Puzzle "${puzzleData.question}" already exists, skipping...`);
    } else {
      await db.insert(riddles).values({
        ...puzzleData,
        hint: puzzleData.hint || null,
        explanation: puzzleData.explanation || null,
        imageUrl: null,
        creatorName: 'System',
        isFanMade: false,
        avgSolveTimeSeconds: null
      });
      console.log(`Added puzzle: ${puzzleData.question} = ${puzzleData.answer}`);
    }
  }
  
  console.log('Emoji Guess category and puzzles added successfully!');
}

addEmojiGuessCategory()
  .then(() => {
    console.log('Completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
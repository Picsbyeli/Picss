import { type RiddleWithCategory } from "@shared/schema";

// Default fallback riddles for initial loading
export const fallbackRiddles: RiddleWithCategory[] = [
  {
    id: 1,
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answer: "echo",
    hint: "Think about something that repeats what you say.",
    explanation: "An echo is a sound that speaks without a mouth and hears without ears. It has no physical form but comes alive with the wind or air that carries the sound.",
    categoryId: 2,
    difficulty: "medium",
    avgSolveTimeSeconds: 30,
    category: {
      name: "Word Riddles",
      colorClass: "secondary"
    }
  },
  {
    id: 2,
    question: "What has keys but no locks, space but no room, and you can enter but not go in?",
    answer: "keyboard",
    hint: "You use it every day when typing.",
    explanation: "A keyboard has keys but doesn't have locks. It has a space bar but not a room, and you can press enter but not physically go in.",
    categoryId: 2,
    difficulty: "easy",
    avgSolveTimeSeconds: 20,
    category: {
      name: "Word Riddles",
      colorClass: "secondary"
    }
  },
  {
    id: 3,
    question: "The more you take, the more you leave behind. What am I?",
    answer: "footsteps",
    hint: "Think about walking.",
    explanation: "As you walk and take more steps, you leave more footsteps behind you.",
    categoryId: 1,
    difficulty: "medium",
    avgSolveTimeSeconds: 35,
    category: {
      name: "Logic Puzzles",
      colorClass: "primary"
    }
  }
];

// Fallback categories for initial loading
export const fallbackCategories = [
  {
    id: 1,
    name: "Logic Puzzles",
    description: "Test your logical thinking",
    colorClass: "primary"
  },
  {
    id: 2,
    name: "Word Riddles",
    description: "Play with words and meanings",
    colorClass: "secondary"
  },
  {
    id: 3,
    name: "Math Puzzles",
    description: "Numbers and mathematical thinking",
    colorClass: "accent"
  }
];

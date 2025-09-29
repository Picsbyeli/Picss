import { db } from "./db";
import { 
  users, categories, riddles, 
  type InsertUser, type InsertCategory, type InsertRiddle 
} from "@shared/schema";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Check if data already exists
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  // Seed guest user
  const guestUser: InsertUser = {
    username: "guest",
    password: "guest",
    score: 0,
    solvedCount: 0,
    avgTimeSeconds: 0
  };
  
  const [user] = await db.insert(users).values(guestUser).returning();
  console.log(`Created user: ${user.username}`);
  
  // Seed categories
  const categoryData: InsertCategory[] = [
    { 
      name: "Logic Puzzles", 
      description: "Test your logical thinking",
      colorClass: "primary" 
    },
    { 
      name: "Word Riddles", 
      description: "Play with words and meanings",
      colorClass: "secondary" 
    },
    { 
      name: "Math Puzzles", 
      description: "Numbers and mathematical thinking",
      colorClass: "accent" 
    },
    { 
      name: "Visual Puzzles", 
      description: "Puzzles that challenge your visual perception",
      colorClass: "warning" 
    },
    { 
      name: "Lateral Thinking", 
      description: "Think outside the box",
      colorClass: "dark" 
    },
    { 
      name: "EV Special", 
      description: "Guess the hidden subject with yes/no questions",
      colorClass: "success" 
    }
  ];
  
  const createdCategories = await Promise.all(
    categoryData.map(async (category) => {
      const [created] = await db.insert(categories).values(category).returning();
      console.log(`Created category: ${created.name}`);
      return created;
    })
  );
  
  // Get category IDs by name
  const getCategoryIdByName = (name: string) => {
    const category = createdCategories.find(c => c.name === name);
    if (!category) throw new Error(`Category not found: ${name}`);
    return category.id;
  };
  
  const logicId = getCategoryIdByName("Logic Puzzles");
  const wordId = getCategoryIdByName("Word Riddles");
  const mathId = getCategoryIdByName("Math Puzzles");
  const visualId = getCategoryIdByName("Visual Puzzles");
  const lateralId = getCategoryIdByName("Lateral Thinking");
  const evSpecialId = getCategoryIdByName("EV Special");
  
  // Seed riddles
  const riddleData: InsertRiddle[] = [
    // Word Riddles
    {
      question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
      answer: "echo",
      hint: "Think about something that repeats what you say.",
      explanation: "An echo is a sound that speaks without a mouth and hears without ears. It has no physical form but comes alive with the wind or air that carries the sound.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "I'm tall when I'm young, and I'm short when I'm old. What am I?",
      answer: "candle",
      hint: "Think about something that burns.",
      explanation: "A candle is tall when it's new (young) but gets shorter as it burns down (gets old).",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has keys but no locks, space but no room, and you can enter but not go in?",
      answer: "keyboard",
      hint: "You use it every day when typing.",
      explanation: "A keyboard has keys but doesn't have locks. It has a space bar but not a room, and you can press enter but not physically go in.",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What gets wetter as it dries?",
      answer: "towel",
      hint: "You use it after showering.",
      explanation: "A towel gets wetter as it dries you or other things.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has a head and a tail, but no body?",
      answer: "coin",
      hint: "It's something you might have in your pocket.",
      explanation: "A coin has a head side and a tail side, but no body.",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "I have branches, but no fruit, trunk, or leaves. What am I?",
      answer: "bank",
      hint: "Think about different meanings of the word 'branch'.",
      explanation: "A bank has branches (locations), but these aren't the same as tree branches with fruit, trunks, or leaves.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has no beginning, end, or middle?",
      answer: "circle",
      hint: "Think about geometric shapes.",
      explanation: "A circle has no beginning, end, or middle - it's a continuous curve.",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What goes up but never comes down?",
      answer: "age",
      hint: "It's something that happens to everyone.",
      explanation: "Your age always increases and never decreases.",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has hands but cannot hold anything?",
      answer: "clock",
      hint: "You check it to see the time.",
      explanation: "A clock has hands (hour and minute hands) but cannot physically hold objects.",
      categoryId: wordId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What runs around a backyard yet never moves?",
      answer: "fence",
      hint: "It surrounds property.",
      explanation: "A fence runs around (encircles) a backyard but doesn't actually move.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What can you catch but not throw?",
      answer: "cold",
      hint: "It's something you don't want to get.",
      explanation: "You can catch a cold (get sick) but you can't throw it.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has a neck but no head?",
      answer: "bottle",
      hint: "You drink from it.",
      explanation: "A bottle has a neck (the narrow part) but doesn't have a head.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What word becomes shorter when you add two letters to it?",
      answer: "short",
      hint: "The answer is literally in the question.",
      explanation: "The word 'short' becomes 'shorter' when you add 'er' to it.",
      categoryId: wordId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What can fill a room but takes up no space?",
      answer: "light",
      hint: "You flip a switch to get it.",
      explanation: "Light fills a room when you turn on a lamp, but light itself doesn't take up physical space.",
      categoryId: wordId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What breaks but never falls, and what falls but never breaks?",
      answer: "day and night",
      hint: "Think about time of day.",
      explanation: "Day breaks (daybreak/dawn) but never falls, and night falls (nightfall) but never breaks.",
      categoryId: wordId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has one eye but cannot see?",
      answer: "needle",
      hint: "It's used for sewing.",
      explanation: "A needle has an eye (the hole where thread goes) but cannot see.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What gets sharper the more you use it?",
      answer: "brain",
      hint: "It's part of your body.",
      explanation: "Your brain gets sharper (more intelligent) the more you exercise it and learn.",
      categoryId: wordId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What has a bed but never sleeps?",
      answer: "river",
      hint: "It flows continuously.",
      explanation: "A river has a bed (riverbed) but water never sleeps.",
      categoryId: wordId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    
    // Logic Puzzles
    {
      question: "If you have me, you want to share me. If you share me, you haven't got me. What am I?",
      answer: "secret",
      hint: "It's something valuable you can't physically touch.",
      explanation: "A secret is something you have but once you share it, it's no longer a secret.",
      categoryId: logicId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
      answer: "map",
      hint: "You use it to find your way.",
      explanation: "A map has representations of cities, mountains, and water, but not the physical houses, trees, or fish.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "The more you take, the more you leave behind. What am I?",
      answer: "footsteps",
      hint: "Think about walking.",
      explanation: "As you walk and take more steps, you leave more footsteps behind you.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What can travel around the world while staying in a corner?",
      answer: "stamp",
      hint: "Think about mailing a letter.",
      explanation: "A stamp stays in the corner of an envelope but can travel around the world through the mail system.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What comes next in this sequence: 1, 1, 2, 3, 5, 8, ?",
      answer: "13",
      hint: "Each number is the sum of the two previous numbers.",
      explanation: "This is the Fibonacci sequence where each number equals the sum of the two preceding ones: 5 + 8 = 13.",
      categoryId: logicId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man builds a house with all four sides facing south. A bear walks by. What color is the bear?",
      answer: "white",
      hint: "Think about where on Earth this could happen.",
      explanation: "The house must be at the North Pole for all sides to face south. Only polar bears (which are white) live at the North Pole.",
      categoryId: logicId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "You are in a dark room with a candle, a wood stove, and a gas lamp. You only have one match. What do you light first?",
      answer: "match",
      hint: "Think about what you need to do before lighting anything else.",
      explanation: "You must light the match first before you can light anything else.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What disappears as soon as you say its name?",
      answer: "silence",
      hint: "Think about what happens when you speak.",
      explanation: "As soon as you say the word 'silence,' the silence is broken.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man lives on the 20th floor of a building. Every morning he takes the elevator down to the ground floor. When he comes home, he takes the elevator to the 10th floor and walks the rest of the way. Why?",
      answer: "he is too short",
      hint: "Think about physical limitations.",
      explanation: "The man is too short to reach the button for the 20th floor, but he can reach the 10th floor button.",
      categoryId: logicId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What gets broken without being held?",
      answer: "promise",
      hint: "It's something you make with words.",
      explanation: "A promise can be broken even though it's not a physical object you can hold.",
      categoryId: logicId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Forward I am heavy, backward I am not. What am I?",
      answer: "ton",
      hint: "Think about spelling and meaning.",
      explanation: "The word 'ton' means something heavy, but spelled backward it becomes 'not'.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What is so fragile that saying its name breaks it?",
      answer: "silence",
      hint: "It's the absence of something.",
      explanation: "Silence is broken the moment you speak or make any sound, including saying the word 'silence'.",
      categoryId: logicId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
      answer: "fire",
      hint: "It's hot and dangerous.",
      explanation: "Fire grows when fed, needs oxygen (air) to survive, but water extinguishes it.",
      categoryId: logicId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What belongs to you but other people use it more than you do?",
      answer: "name",
      hint: "It identifies you but others say it often.",
      explanation: "Your name belongs to you, but other people use it when they talk to or about you.",
      categoryId: logicId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    
    // Math Puzzles
    {
      question: "If 1=5, 2=10, 3=15, and 4=20, then 5=?",
      answer: "25",
      hint: "Look for the pattern in the equation.",
      explanation: "Each number is being multiplied by 5, so 5×5=25.",
      categoryId: mathId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A farmer has 17 sheep. All but 9 die. How many sheep are left?",
      answer: "9",
      hint: "Read the question carefully.",
      explanation: "The phrase 'all but 9 die' means that 9 sheep survived, not that 9 sheep died.",
      categoryId: mathId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "If you multiply this number by any other number, the answer will always be the same. What number is it?",
      answer: "0",
      hint: "Think about special properties of numbers.",
      explanation: "When you multiply any number by zero, the result is always zero.",
      categoryId: mathId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Using only addition, how can you use eight eights to get the number 1000?",
      answer: "888 + 88 + 8 + 8 + 8",
      hint: "Try different place values.",
      explanation: "888 + 88 + 8 + 8 + 8 = 1000, using eight '8' digits in total.",
      categoryId: mathId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What is half of two plus two?",
      answer: "3",
      hint: "Think about order of operations.",
      explanation: "Half of two is 1, plus two equals 3. (Not half of four, which would be 2).",
      categoryId: mathId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "If there are 12 fish and half of them drown, how many are left?",
      answer: "12",
      hint: "Think about what fish need to survive.",
      explanation: "Fish can't drown because they live underwater and breathe through gills.",
      categoryId: mathId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
      answer: "5 cents",
      hint: "Don't assume the ball costs 10 cents.",
      explanation: "If the ball costs 5 cents, then the bat costs $1.05 (5 cents + $1.00 more), totaling $1.10.",
      categoryId: mathId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What comes next: 2, 4, 8, 16, ?",
      answer: "32",
      hint: "Each number is doubled.",
      explanation: "This is a sequence where each number is multiplied by 2: 16 × 2 = 32.",
      categoryId: mathId,
      difficulty: "easy",
      avgSolveTimeSeconds: 0
    },
    {
      question: "If you have 5 apples and you take away 3, how many do you have?",
      answer: "3",
      hint: "Read the question carefully.",
      explanation: "You took away 3 apples, so you have 3 apples with you.",
      categoryId: mathId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What number do you get when you multiply all the numbers on a telephone keypad?",
      answer: "0",
      hint: "Think about what happens when you multiply by zero.",
      explanation: "Since 0 is on the keypad and any number multiplied by 0 equals 0.",
      categoryId: mathId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "If 2 = 6, 3 = 12, 4 = 20, 5 = 30, then 6 = ?",
      answer: "42",
      hint: "Look for the pattern: each number times something.",
      explanation: "The pattern is n × (n + 1): 6 × (6 + 1) = 6 × 7 = 42.",
      categoryId: mathId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man has 53 socks in his drawer: 21 identical blue, 15 identical black, and 17 identical red. The lights are out and he is completely in the dark. How many socks must he take out to make 100 percent certain he has at least one pair of matching socks?",
      answer: "4",
      hint: "Think worst case scenario.",
      explanation: "In the worst case, he could pull out one sock of each color (3 socks), so the 4th sock must match one of the first three.",
      categoryId: mathId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "How many seconds are there in a year?",
      answer: "12",
      hint: "Think about the word 'second' differently.",
      explanation: "There are 12 seconds in a year: January 2nd, February 2nd, March 2nd, etc.",
      categoryId: mathId,
      difficulty: "hard",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What is the next number in this sequence: 1, 4, 9, 16, 25, ?",
      answer: "36",
      hint: "These are perfect squares.",
      explanation: "These are perfect squares: 1², 2², 3², 4², 5², 6² = 36.",
      categoryId: mathId,
      difficulty: "medium",
      avgSolveTimeSeconds: 0
    },
    
    // Visual Puzzles
    {
      question: "What 5-letter word becomes shorter when you add two letters to it?",
      answer: "short",
      hint: "The word itself is an adjective describing length.",
      explanation: "The word 'short' becomes 'shorter' when you add 'er' to it.",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/teaser1.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What word in the English language does the following: The first two letters signify a male, the first three letters signify a female, the first four letters signify a great person, while the entire word signifies a great woman?",
      answer: "heroine",
      hint: "Break down the word by the number of letters specified.",
      explanation: "'He' is male, 'her' is female, 'hero' is a great person, and 'heroine' is a great woman.",
      categoryId: visualId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/teaser2.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase is represented by this rebus puzzle?",
      answer: "reading between the lines",
      hint: "Look at what's literally between the vertical lines.",
      explanation: "The word 'READING' appears on the left, 'THE' appears on the right, and there are several vertical lines between them - thus 'reading between the lines'.",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus1.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase is represented by this rebus puzzle?",
      answer: "painless operation",
      hint: "Notice what's happening to the word 'PAIN'.",
      explanation: "The word 'PAIN' is crossed out above the word 'OPERATION', representing a 'painless operation'.",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus2.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What word is represented by this rebus puzzle?",
      answer: "touchdown",
      hint: "Consider what's visually shown - something on top of something else.",
      explanation: "The word 'DOWN' appears with what looks like a bar or 'touch' above it, creating 'touchdown'.",
      categoryId: visualId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/rebus3.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase is represented by this rebus puzzle?",
      answer: "growing economy",
      hint: "Look at what's happening to the size of the text.",
      explanation: "The word 'ECONOMY' appears three times, each time getting larger - representing a 'growing economy'.",
      categoryId: visualId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/rebus4.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase is represented by this rebus puzzle?",
      answer: "split level",
      hint: "Notice what's happening to the word 'LEVEL'.",
      explanation: "The word 'LEVEL' is split into 'LEV' and 'EL' with vertical lines between, representing a 'split level'.",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus5.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase is represented by this: THINKING THINKING THINKING THINKING THINKING?",
      answer: "thinking out loud",
      hint: "Notice how many times the word appears.",
      explanation: "The word 'THINKING' is repeated 5 times out loud, representing 'thinking out loud'.",
      categoryId: visualId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/rebus6.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What does this represent: BANNED BANNED BANNED?",
      answer: "three strikes",
      hint: "Think about rules and consequences.",
      explanation: "Three instances of 'BANNED' represents the concept of 'three strikes' (as in three strikes and you're out).",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus7.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What word is shown: MAN BOARD?",
      answer: "overboard",
      hint: "Look at the position of the words.",
      explanation: "The word 'MAN' appears over the word 'BOARD', creating 'man overboard'.",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus8.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What does this visual puzzle show: TIMING TIM ING?",
      answer: "split second timing",
      hint: "Notice how the word is divided.",
      explanation: "The word 'TIMING' is split with 'TIM ING' below, representing 'split second timing'.",
      categoryId: visualId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/rebus9.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Decode this visual: HEAD HEELS?",
      answer: "head over heels",
      hint: "Look at the order of the words.",
      explanation: "'HEAD' appears over 'HEELS', representing the phrase 'head over heels'.",
      categoryId: visualId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/rebus10.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What phrase does this show: CYCLE CYCLE CYCLE?",
      answer: "tricycle",
      hint: "Count how many cycles there are.",
      explanation: "Three instances of 'CYCLE' creates 'tri-cycle' (tricycle).",
      categoryId: visualId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/rebus11.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "What does this represent: SCHOOL SCHOOL?",
      answer: "high school",
      hint: "Notice the position of the words.",
      explanation: "One 'SCHOOL' appears higher than the other, representing 'high school'.",
      categoryId: visualId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/rebus12.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Decode this puzzle: R E A D I N G?",
      answer: "reading between the lines",
      hint: "Look at the spacing between letters.",
      explanation: "The letters in 'READING' have extra spaces between them, representing 'reading between the lines'.",
      categoryId: visualId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/rebus13.svg",
      avgSolveTimeSeconds: 0
    },
    
    // Lateral Thinking
    {
      question: "A man leaves home, takes three left turns, and returns home facing the same direction as when he left. There are two masked men waiting for him. Who are they?",
      answer: "catcher and umpire",
      hint: "Think about sports.",
      explanation: "This describes a baseball scenario. After hitting the ball, the batter runs around the bases (3 left turns) to home plate, where the catcher and umpire (wearing masks) are waiting.",
      categoryId: lateralId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/teaser3.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A doctor and a boy were fishing. The boy was the doctor's son, but the doctor was not the boy's father. Who was the doctor?",
      answer: "mother",
      hint: "Don't make assumptions about the doctor.",
      explanation: "The doctor was the boy's mother.",
      categoryId: lateralId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/teaser4.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A woman shoots her husband, then holds him underwater for 5 minutes. Next, she hangs him. Right after, they go out for a lovely dinner. How?",
      answer: "photographer",
      hint: "Think about different meanings of these actions.",
      explanation: "She's a photographer who took his picture (shot), developed it in a chemical bath (held underwater), and hung it to dry.",
      categoryId: lateralId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/lateral1.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Every day, a man takes the elevator from the 15th floor to the ground floor. But he only takes the elevator to the 7th floor and walks the rest of the way up. Except on rainy days, when he takes the elevator all the way up. Why?",
      answer: "he is too short to reach the button",
      hint: "Think about what changes on rainy days.",
      explanation: "The man is too short to reach the higher floor buttons, but on rainy days he has an umbrella to help him reach the 15th floor button.",
      categoryId: lateralId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/lateral2.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man lives in a house where all four walls face south. A bear walks past the house. What color is the bear?",
      answer: "white",
      hint: "Think about geography and where this is possible.",
      explanation: "The house must be at the North Pole for all walls to face south. Only polar bears (white) live there.",
      categoryId: lateralId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/lateral3.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man walks into an elevator and presses the button for the 40th floor. The elevator starts going up, but halfway through the ride, the man suddenly realizes something and presses the button for the 20th floor instead. When the doors open, he gets out and takes the stairs the rest of the way. Why?",
      answer: "power outage",
      hint: "Think about what would make someone choose stairs over an elevator.",
      explanation: "There was a power outage, so the elevator stopped working. He had to get out and use the stairs.",
      categoryId: lateralId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/lateral4.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man enters a room and suddenly all the lights go out. He can't see anything, but he knows exactly where he is and what he needs to do. He reaches into his pocket, pulls something out, and within 30 seconds the lights are back on. What did he pull out?",
      answer: "coins for the meter",
      hint: "Think about old-fashioned payment systems.",
      explanation: "He was in a room with a coin-operated light meter that had run out of money.",
      categoryId: lateralId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/lateral5.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A woman enters a hardware store and asks for something. The clerk asks, 'How long do you want it?' She says, '15 inches.' The clerk asks, 'How thick?' She says, 'About an inch.' Then he asks her 'What color?' and she says 'It doesn't matter, I'll paint it.' What is she buying?",
      answer: "chain",
      hint: "Think about items sold by length and thickness.",
      explanation: "She's buying a chain, which is sold by length, has a thickness measurement, and can be painted any color.",
      categoryId: lateralId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/lateral6.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man is found dead in his study. He was shot in the head while sitting at his desk. The police find a gun on the floor, a tape recorder on the desk, and a note that says 'I can't live with the guilt anymore.' When they play the tape recorder, they hear the man say 'I can't live with the guilt anymore' followed by a gunshot. The police immediately know it was murder. How?",
      answer: "tape was rewound",
      hint: "Think about the state of the tape recorder.",
      explanation: "If it was suicide, the tape would be at the end. Since it was rewound and ready to play, someone else must have rewound it after the shooting.",
      categoryId: lateralId,
      difficulty: "hard",
      imageUrl: "/src/assets/single-teasers/lateral7.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "A man calls his wife from his office and tells her he's bringing his boss home for dinner. His wife has never met the boss before. When the man arrives home with someone, his wife immediately knows it's not his boss. How?",
      answer: "boss is a woman",
      hint: "Think about assumptions people make.",
      explanation: "The wife assumed the boss was a man based on her husband's pronoun usage, but when a woman arrived, she knew it wasn't the boss.",
      categoryId: lateralId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/lateral8.svg",
      avgSolveTimeSeconds: 0
    },
    
    // EV Special riddles
    {
      question: "Guess the movie: This movie is animated, has 2 main characters, is widely known, is for kids/family, and the main character is not human.",
      answer: "Shrek",
      hint: "It's about an ogre who lives in a swamp.",
      explanation: "Shrek is an animated movie with two main characters (Shrek and Donkey), is very popular, made for families, and the main character is an ogre.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser1.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the character: This character is from a popular TV show, wears distinctive clothing, has supernatural abilities, and is known for a catchphrase.",
      answer: "Superman",
      hint: "He wears a red cape and blue suit.",
      explanation: "Superman is from various TV shows, wears a distinctive blue suit with red cape, has many superpowers, and is known for phrases like 'Up, up and away!'",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser2.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the animal: This animal lives in water, has no backbone, has eight limbs, and is known for its intelligence.",
      answer: "Octopus",
      hint: "It can change color and squeeze through tight spaces.",
      explanation: "An octopus lives in the ocean, is an invertebrate (no backbone), has eight tentacles, and is considered one of the most intelligent sea creatures.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser3.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the place: This location is man-made, very tall, located in a major city, and is a popular tourist attraction.",
      answer: "Eiffel Tower",
      hint: "It's in a European capital city known for romance.",
      explanation: "The Eiffel Tower is a man-made structure in Paris, France. It's very tall, located in a major city, and is one of the most visited tourist attractions in the world.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser4.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the item: This object is found in most homes, used daily, comes in different sizes, and can store things.",
      answer: "Refrigerator",
      hint: "It keeps things cold.",
      explanation: "A refrigerator is found in most homes, used daily to store and preserve food, comes in various sizes, and is designed for storage.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser5.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the food: This food is round, has cheese, can have various toppings, and is often delivered to your door.",
      answer: "pizza",
      hint: "It's baked in an oven and cut into slices.",
      explanation: "Pizza is round, has cheese as a main ingredient, comes with various toppings, and is commonly delivered.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser6.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the vehicle: This vehicle has two wheels, is powered by pedaling, and is environmentally friendly.",
      answer: "bicycle",
      hint: "You use your legs to make it move.",
      explanation: "A bicycle has two wheels, is powered by human pedaling, and produces no emissions, making it environmentally friendly.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser7.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the game: This game is played on a board with 64 squares, involves strategy, and has pieces like kings and queens.",
      answer: "chess",
      hint: "It's often called the 'game of kings'.",
      explanation: "Chess is played on an 8x8 board (64 squares), requires strategic thinking, and features pieces including kings, queens, bishops, knights, rooks, and pawns.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser8.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the instrument: This instrument has strings, is played with fingers or a pick, and comes in acoustic and electric varieties.",
      answer: "guitar",
      hint: "Rock stars often play this on stage.",
      explanation: "A guitar has strings that vibrate to create sound, can be played by plucking with fingers or using a pick, and comes in both acoustic and electric forms.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser9.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the season: This season comes after summer, leaves change colors, and people harvest crops.",
      answer: "autumn",
      hint: "Also known by another name in America.",
      explanation: "Autumn (also called fall) follows summer, is characterized by leaves changing from green to red, orange, and yellow, and is when many crops are harvested.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser10.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the profession: This person wears a white coat, uses a stethoscope, and helps people when they're sick.",
      answer: "doctor",
      hint: "You visit them when you need medical help.",
      explanation: "A doctor typically wears a white coat as professional attire, uses a stethoscope to listen to heartbeats and breathing, and provides medical care to sick patients.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser11.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the weather phenomenon: This appears in the sky after rain, has seven colors, and is considered lucky by some cultures.",
      answer: "rainbow",
      hint: "It forms an arc across the sky.",
      explanation: "A rainbow appears when sunlight refracts through water droplets after rain, displaying seven colors (red, orange, yellow, green, blue, indigo, violet) in an arc.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser12.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the building: This building is very tall, has many floors, people work in offices there, and you need an elevator to reach the top.",
      answer: "skyscraper",
      hint: "It's found in big cities and seems to touch the sky.",
      explanation: "A skyscraper is a very tall building with numerous floors, typically housing offices or apartments, and requires elevators for vertical transportation due to its height.",
      categoryId: evSpecialId,
      difficulty: "medium",
      imageUrl: "/src/assets/single-teasers/ev-teaser13.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the technology: This device fits in your pocket, makes calls, sends messages, and connects to the internet.",
      answer: "smartphone",
      hint: "Almost everyone has one today.",
      explanation: "A smartphone is a portable device that combines phone calls, text messaging, internet access, and many other functions in a pocket-sized form factor.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser14.svg",
      avgSolveTimeSeconds: 0
    },
    {
      question: "Guess the celestial object: This object appears at night, changes shape throughout the month, and affects ocean tides.",
      answer: "moon",
      hint: "Werewolves are said to transform during its full phase.",
      explanation: "The moon is visible at night, goes through phases (new, crescent, full, etc.) during its monthly cycle, and its gravitational pull influences Earth's ocean tides.",
      categoryId: evSpecialId,
      difficulty: "easy",
      imageUrl: "/src/assets/single-teasers/ev-teaser15.svg",
      avgSolveTimeSeconds: 0
    }
  ];
  
  // Insert all riddles
  for (const riddle of riddleData) {
    const [created] = await db.insert(riddles).values(riddle).returning();
    console.log(`Created riddle: ${created.question.substring(0, 30)}...`);
  }
  
  console.log("✅ Database seeded successfully!");
}

// Execute the seed function
seedDatabase().catch(e => {
  console.error("Error seeding database:", e);
  process.exit(1);
});
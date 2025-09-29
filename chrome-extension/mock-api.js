/**
 * Mock API data for Burble Chrome Extension
 * 
 * This file provides fallback data when the app is offline.
 */

// Categories for the Emoji Guess game
export const mockCategories = [
  { id: 1, name: "Movies", colorClass: "bg-blue-500" },
  { id: 2, name: "Food", colorClass: "bg-green-500" },
  { id: 3, name: "Places", colorClass: "bg-amber-500" },
  { id: 4, name: "Objects", colorClass: "bg-purple-500" },
  { id: 5, name: "Activities", colorClass: "bg-pink-500" },
  { id: 6, name: "Expressions", colorClass: "bg-red-500" }
];

// Emoji riddles for the Emoji Guess game
export const mockEmojiRiddles = [
  {
    id: 101,
    categoryId: 1,
    question: "🧙‍♂️ 💍 🌋",
    answer: "Lord of the Rings",
    difficulty: "easy",
    hint: "A fantasy trilogy about a magical ring that must be destroyed."
  },
  {
    id: 102,
    categoryId: 1,
    question: "🚢 💔 🧊",
    answer: "Titanic",
    difficulty: "easy",
    hint: "A romance film about a famous shipwreck."
  },
  {
    id: 103,
    categoryId: 1,
    question: "🎭 🃏 🦇",
    answer: "The Dark Knight",
    difficulty: "medium",
    hint: "A superhero film featuring Batman and the Joker."
  },
  {
    id: 104,
    categoryId: 1,
    question: "🦖 🏝️ 🧬",
    answer: "Jurassic Park",
    difficulty: "easy",
    hint: "A film about cloned dinosaurs in a theme park."
  },
  {
    id: 105,
    categoryId: 1,
    question: "👨‍🚀 🌌 🕳️",
    answer: "Interstellar",
    difficulty: "medium",
    hint: "A sci-fi film about space travel and black holes."
  },
  {
    id: 106,
    categoryId: 1,
    question: "🧠 💭 🏙️",
    answer: "Inception",
    difficulty: "medium",
    hint: "A film about entering people's dreams."
  },
  {
    id: 107,
    categoryId: 1,
    question: "🎬 🧟‍♂️ 🧠",
    answer: "The Walking Dead",
    difficulty: "medium",
    hint: "A TV series about surviving a zombie apocalypse."
  },
  {
    id: 108,
    categoryId: 1,
    question: "🔍 🐠 🌊",
    answer: "Finding Nemo",
    difficulty: "easy",
    hint: "An animated film about a father searching for his son in the ocean."
  },
  {
    id: 109,
    categoryId: 1,
    question: "👸 ❄️ ⛄",
    answer: "Frozen",
    difficulty: "easy",
    hint: "An animated Disney film about a princess with ice powers."
  },
  {
    id: 110,
    categoryId: 1,
    question: "🦁 👑 🌍",
    answer: "The Lion King",
    difficulty: "easy",
    hint: "An animated Disney film about a lion cub who becomes king."
  },
  {
    id: 201,
    categoryId: 2,
    question: "🍕 🇮🇹 🧀",
    answer: "Pizza",
    difficulty: "easy",
    hint: "A popular Italian dish with cheese and toppings."
  },
  {
    id: 202,
    categoryId: 2,
    question: "🍔 🍟 🥤",
    answer: "Fast Food",
    difficulty: "easy",
    hint: "A type of quick meal often served at restaurants like McDonald's."
  },
  {
    id: 203,
    categoryId: 2,
    question: "🍣 🍱 🇯🇵",
    answer: "Japanese Cuisine",
    difficulty: "medium",
    hint: "Food from Japan including raw fish dishes."
  },
  {
    id: 204,
    categoryId: 2,
    question: "🍝 🍷 🇮🇹",
    answer: "Italian Food",
    difficulty: "easy",
    hint: "Cuisine from Italy featuring pasta and wine."
  },
  {
    id: 205,
    categoryId: 2,
    question: "🌮 🌯 🇲🇽",
    answer: "Mexican Food",
    difficulty: "easy",
    hint: "Cuisine from Mexico including wrapped dishes."
  },
  {
    id: 301,
    categoryId: 3,
    question: "🗽 🏙️ 🍎",
    answer: "New York City",
    difficulty: "easy",
    hint: "A major US city known as 'The Big Apple'."
  },
  {
    id: 302,
    categoryId: 3,
    question: "🗼 🏯 🍜",
    answer: "Tokyo",
    difficulty: "medium",
    hint: "The capital city of Japan."
  },
  {
    id: 303,
    categoryId: 3,
    question: "🏛️ 🍕 🏟️",
    answer: "Rome",
    difficulty: "medium",
    hint: "The capital of Italy, known for ancient architecture."
  },
  {
    id: 304,
    categoryId: 3,
    question: "🐘 🏏 🍛",
    answer: "India",
    difficulty: "medium",
    hint: "A large country in Asia known for spicy food and cricket."
  },
  {
    id: 305,
    categoryId: 3,
    question: "🏝️ 🌊 🏄‍♂️",
    answer: "Hawaii",
    difficulty: "easy",
    hint: "A US state made up of islands, known for surfing."
  },
  {
    id: 401,
    categoryId: 4,
    question: "📱 🔋 📲",
    answer: "Smartphone",
    difficulty: "easy",
    hint: "A portable device used for calls, texts, and apps."
  },
  {
    id: 402,
    categoryId: 4,
    question: "☕ 🥛 🍵",
    answer: "Coffee Cup",
    difficulty: "easy",
    hint: "A container used for hot beverages."
  },
  {
    id: 403,
    categoryId: 4,
    question: "🚗 🛣️ 🚦",
    answer: "Car",
    difficulty: "easy",
    hint: "A common vehicle used for transportation."
  },
  {
    id: 404,
    categoryId: 4,
    question: "🎮 🕹️ 👾",
    answer: "Video Game Console",
    difficulty: "medium",
    hint: "A device used to play games on a TV."
  },
  {
    id: 405,
    categoryId: 4,
    question: "📚 📖 🔍",
    answer: "Book",
    difficulty: "easy",
    hint: "A bound collection of pages with text."
  },
  {
    id: 501,
    categoryId: 5,
    question: "🏃‍♂️ 🥵 🏁",
    answer: "Running",
    difficulty: "easy",
    hint: "Moving quickly on foot, often as exercise or sport."
  },
  {
    id: 502,
    categoryId: 5,
    question: "🏊‍♀️ 💦 🏊‍♂️",
    answer: "Swimming",
    difficulty: "easy",
    hint: "Moving through water using body movements."
  },
  {
    id: 503,
    categoryId: 5,
    question: "🎨 🖌️ 🎭",
    answer: "Art",
    difficulty: "medium",
    hint: "Creative expression through various media."
  },
  {
    id: 504,
    categoryId: 5,
    question: "🎸 🎹 🎵",
    answer: "Music",
    difficulty: "easy",
    hint: "Creating sounds with instruments or voice."
  },
  {
    id: 505,
    categoryId: 5,
    question: "📸 📱 🌆",
    answer: "Photography",
    difficulty: "medium",
    hint: "Capturing images with a camera."
  },
  {
    id: 601,
    categoryId: 6,
    question: "😂 😹 🤣",
    answer: "Laughing",
    difficulty: "easy",
    hint: "Making sounds expressing joy or amusement."
  },
  {
    id: 602,
    categoryId: 6,
    question: "😭 😢 👋",
    answer: "Crying",
    difficulty: "easy",
    hint: "Shedding tears, usually from sadness."
  },
  {
    id: 603,
    categoryId: 6,
    question: "😡 🤬 💢",
    answer: "Anger",
    difficulty: "easy",
    hint: "Feeling or showing strong annoyance or displeasure."
  },
  {
    id: 604,
    categoryId: 6,
    question: "😍 💘 💑",
    answer: "Love",
    difficulty: "easy",
    hint: "A strong feeling of affection."
  },
  {
    id: 605,
    categoryId: 6,
    question: "😱 👻 🙀",
    answer: "Fear",
    difficulty: "easy",
    hint: "An unpleasant emotion caused by threat or danger."
  }
];

// Questions for the "Are You My Valentine?" game
export const mockValentineQuestions = [
  {
    id: 1,
    question: "Do I have a job that requires a uniform?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 2,
    question: "Do I work with people who are sick?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 3,
    question: "Do I work mostly during the day?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 4,
    question: "Am I famous?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 5,
    question: "Do I work in an office?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 6,
    question: "Do I have to go to college for my job?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 7,
    question: "Do I use tools for my job?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 8,
    question: "Am I a fictional character?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 9,
    question: "Do I mainly work indoors?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 10,
    question: "Am I older than 30?",
    answer: "Doctor",
    difficulty: "medium"
  },
  {
    id: 11,
    question: "Do I have a prestigious job?",
    answer: "Doctor",
    difficulty: "easy"
  },
  {
    id: 12,
    question: "Do I work in a hospital?",
    answer: "Doctor",
    difficulty: "easy"
  },
  {
    id: 13,
    question: "Do I help heal people?",
    answer: "Doctor",
    difficulty: "easy"
  },
  {
    id: 14,
    question: "Do I wear a white coat at work?",
    answer: "Doctor",
    difficulty: "easy"
  },
  {
    id: 15,
    question: "Do I make a lot of money?",
    answer: "Doctor",
    difficulty: "easy"
  },
  {
    id: 16,
    question: "Do I perform surgeries?",
    answer: "Doctor",
    difficulty: "hard"
  },
  {
    id: 17,
    question: "Do I diagnose illnesses?",
    answer: "Doctor",
    difficulty: "hard"
  },
  {
    id: 18,
    question: "Do I prescribe medications?",
    answer: "Doctor",
    difficulty: "hard"
  },
  {
    id: 19,
    question: "Do I have 'MD' after my name?",
    answer: "Doctor",
    difficulty: "hard"
  },
  {
    id: 20,
    question: "Do I use a stethoscope?",
    answer: "Doctor",
    difficulty: "hard"
  },
  {
    id: 21,
    question: "Am I an action movie star?",
    answer: "Superhero",
    difficulty: "medium"
  },
  {
    id: 22,
    question: "Do I wear a special costume?",
    answer: "Superhero",
    difficulty: "medium"
  },
  {
    id: 23,
    question: "Do I have special powers?",
    answer: "Superhero",
    difficulty: "medium"
  },
  {
    id: 24,
    question: "Do I fight crime?",
    answer: "Superhero",
    difficulty: "medium"
  },
  {
    id: 25,
    question: "Am I a real person?",
    answer: "Superhero",
    difficulty: "medium"
  },
  {
    id: 26,
    question: "Am I from another planet?",
    answer: "Superhero",
    difficulty: "hard"
  },
  {
    id: 27,
    question: "Do I have a secret identity?",
    answer: "Superhero",
    difficulty: "hard"
  },
  {
    id: 28,
    question: "Do I appear in comic books?",
    answer: "Superhero",
    difficulty: "hard"
  },
  {
    id: 29,
    question: "Do I have an arch-nemesis?",
    answer: "Superhero",
    difficulty: "hard"
  },
  {
    id: 30,
    question: "Am I part of a team of similar people?",
    answer: "Superhero",
    difficulty: "hard"
  }
];

// Words for the Burble game
export const mockBurbleWords = [
  {
    id: 501,
    word: "HAPPY",
    difficulty: "easy"
  },
  {
    id: 502,
    word: "SMILE",
    difficulty: "easy"
  },
  {
    id: 503,
    word: "HEART",
    difficulty: "easy"
  },
  {
    id: 504,
    word: "SWEET",
    difficulty: "easy"
  },
  {
    id: 505,
    word: "OCEAN",
    difficulty: "medium"
  },
  {
    id: 506,
    word: "BEACH",
    difficulty: "medium"
  },
  {
    id: 507,
    word: "SMART",
    difficulty: "medium"
  },
  {
    id: 508,
    word: "MUSIC",
    difficulty: "medium"
  },
  {
    id: 509,
    word: "QUARK",
    difficulty: "hard"
  },
  {
    id: 510,
    word: "VODKA",
    difficulty: "hard"
  },
  {
    id: 511,
    word: "PIXEL",
    difficulty: "hard"
  },
  {
    id: 512,
    word: "JUMBO",
    difficulty: "hard"
  },
  {
    id: 513,
    word: "QUIPS",
    difficulty: "extreme"
  },
  {
    id: 514,
    word: "JAZZY",
    difficulty: "extreme"
  },
  {
    id: 515,
    word: "VEXED",
    difficulty: "extreme"
  },
  {
    id: 516,
    word: "QUIRK",
    difficulty: "extreme"
  }
];

// Mock user data
export const mockUserData = {
  username: "Guest",
  score: 125,
  solvedCount: 12,
  valentineCount: 3,
  emojiCount: 7,
  burbleCount: 2,
  lastPlayed: new Date().toISOString(),
  achievements: ["First Win", "Emoji Master", "Quick Solver"]
};

// Mock hints
export const mockHints = {
  emoji: {
    101: "Think of a fantasy series with a powerful object that must be destroyed.",
    102: "A famous historical disaster at sea with a love story.",
    103: "A DC superhero movie featuring the Joker.",
    104: "A movie about cloned prehistoric creatures.",
    105: "A sci-fi movie involving time dilation and gravitational anomalies."
  },
  burble: {
    501: "A positive emotional state.",
    502: "What you do when you're happy.",
    503: "The symbol of love and the organ that pumps blood.",
    504: "The taste of sugar or honey."
  },
  general: [
    "Look at the emojis carefully. What do they represent together?",
    "Think about famous titles or phrases related to these symbols.",
    "Consider word associations with each emoji, then combine them.",
    "The difficulty level affects how obvious the connection is.",
    "Sometimes the emojis represent sounds rather than objects."
  ]
};

// Mock leaderboard data
export const mockLeaderboard = [
  { username: "EmojiFan42", score: 1250, solvedCount: 78 },
  { username: "PuzzleKing", score: 980, solvedCount: 65 },
  { username: "RiddleMaster", score: 870, solvedCount: 59 },
  { username: "BrainTeaserPro", score: 750, solvedCount: 48 },
  { username: "EmojiDecoder", score: 680, solvedCount: 42 },
  { username: "ValentineHunter", score: 560, solvedCount: 37 },
  { username: "WordNerd123", score: 490, solvedCount: 31 },
  { username: "PuzzleSolver", score: 420, solvedCount: 28 },
  { username: "BrainGym", score: 380, solvedCount: 25 },
  { username: "EmojiWhiz", score: 320, solvedCount: 21 }
];
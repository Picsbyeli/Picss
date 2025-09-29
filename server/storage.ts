import { 
  users, categories, riddles, userProgress, userFavorites,
  gameSessions, gameParticipants, gameAnswers,
  quizTopics, quizQuestions, dungeonRuns,
  burblemonSpecies, playerBurblemons, mapZones, zonePaths,
  playerMapProgress, wildEncounters, items, playerInventory,
  playerEconomy, battleRecords,
  geoMaps, geoRegions, geoGameResults,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Riddle, type InsertRiddle,
  type UserProgress, type InsertUserProgress,
  type UserFavorite, type InsertUserFavorite,
  type GameSession, type InsertGameSession,
  type GameParticipant, type InsertGameParticipant,
  type GameAnswer, type InsertGameAnswer,
  type QuizTopic, type InsertQuizTopic,
  type QuizQuestion, type InsertQuizQuestion,
  type DungeonRun, type InsertDungeonRun,
  type BurblemonSpecies, type InsertBurblemonSpecies,
  type PlayerBurblemon, type InsertPlayerBurblemon,
  type MapZone, type InsertMapZone,
  type ZonePath, type InsertZonePath,
  type PlayerMapProgress, type InsertPlayerMapProgress,
  type WildEncounter, type InsertWildEncounter,
  type Item, type InsertItem,
  type PlayerInventory, type InsertPlayerInventory,
  type PlayerEconomy, type InsertPlayerEconomy,
  type BattleRecord, type InsertBattleRecord,
  type GeoMap, type InsertGeoMap,
  type GeoRegion, type InsertGeoRegion,
  type GeoGameResult, type InsertGeoGameResult,
  type GeoMapWithRegions,
  type RiddleWithCategory, type FavoriteWithRiddleAndCategory,
  type GameSessionWithParticipants, type QuizTopicWithQuestions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<InsertUser>): Promise<User | null>;
  updateUserScore(userId: number, scoreChange: number): Promise<User>;
  updateBotBattleResult(userId: number, won: boolean): Promise<User>;
  removeUsersByEmail(emailPattern: string): Promise<void>;
  getAllUsers(): Promise<User[]>; // For leaderboard
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Riddle operations
  getAllRiddles(): Promise<Riddle[]>;
  getRiddleById(id: number): Promise<Riddle | undefined>;
  getRiddlesByCategory(categoryId: number): Promise<Riddle[]>;
  getRiddlesWithCategories(): Promise<RiddleWithCategory[]>;
  createRiddle(riddle: InsertRiddle): Promise<Riddle>;
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserRiddleProgress(userId: number, riddleId: number): Promise<UserProgress | undefined>;
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserStats(userId: number): Promise<{ 
    score: number; 
    solvedCount: number; 
    avgTimeSeconds: number; 
  }>;
  
  // User favorites operations
  getUserFavorites(userId: number): Promise<FavoriteWithRiddleAndCategory[]>;
  toggleUserFavorite(userId: number, riddleId: number): Promise<{ added: boolean }>;
  isRiddleFavorited(userId: number, riddleId: number): Promise<boolean>;
  
  // Multiplayer game operations
  getRandomRiddlesByCategory(categoryId: number, count: number): Promise<Riddle[]>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSessionByCode(sessionCode: string): Promise<GameSession | undefined>;
  getGameSessionWithParticipants(sessionId: number): Promise<GameSessionWithParticipants | undefined>;
  joinGameSession(sessionId: number, userId: number): Promise<GameParticipant>;
  markPlayerReady(sessionId: number, userId: number): Promise<void>;
  startGameSession(sessionId: number): Promise<void>;
  updateGameQuestionIndex(sessionId: number, questionIndex: number): Promise<void>;
  finishGameSession(sessionId: number): Promise<void>;
  saveGameAnswer(answer: InsertGameAnswer): Promise<GameAnswer>;
  updateParticipantScore(sessionId: number, userId: number, points: number): Promise<void>;
  getQuestionAnswers(sessionId: number, questionIndex: number): Promise<GameAnswer[]>;
  
  // Battle system operations
  updateParticipantHP(sessionId: number, userId: number, newHP: number): Promise<void>;
  updateParticipantShield(sessionId: number, userId: number, hasShield: boolean): Promise<void>;
  updateParticipantCharge(sessionId: number, userId: number, chargePower: number): Promise<void>;
  updateParticipantBattleAction(sessionId: number, userId: number, action: string): Promise<void>;
  processBattleAction(sessionId: number, attackerId: number, targetId: number, action: string, baseDamage: number): Promise<{ damage: number; shieldBroken: boolean; targetHP: number }>;
  resetParticipantBattleStats(sessionId: number, userId: number): Promise<void>;
  
  // Sprite system operations
  updateParticipantSprite(sessionId: number, userId: number, spriteType: string): Promise<void>;
  updateParticipantEnergy(sessionId: number, userId: number, energyDelta: number): Promise<void>;
  getSpriteInfo(spriteType: string): { startingHp: number; startingEnergy: number; correctBonus: number; incorrectPenalty: number; hasReflect?: boolean };
  initializeParticipantWithSprite(sessionId: number, userId: number, spriteType: string): Promise<void>;
  
  // Bot functionality
  createBotUser(): Promise<User>;
  addBotToSession(sessionId: number): Promise<GameParticipant>;
  getBotAnswer(riddle: Riddle): Promise<{ answer: string; isCorrect: boolean; timeToAnswer: number }>;
  getBotBattleAction(participant: GameParticipant): Promise<string>;
  
  // Quiz operations for solo dungeon
  getAllQuizTopics(): Promise<QuizTopic[]>;
  getQuizTopicById(id: number): Promise<QuizTopic | undefined>;
  getQuizTopicWithQuestions(id: number): Promise<QuizTopicWithQuestions | undefined>;
  createQuizTopic(topic: InsertQuizTopic): Promise<QuizTopic>;
  getQuestionsByTopic(topicId: number, difficulty?: string, limit?: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  validateQuizAnswer(questionId: number, userAnswer: string): Promise<{ isCorrect: boolean; explanation?: string; energyReward: number }>;
  
  // Dungeon run operations
  createDungeonRun(run: InsertDungeonRun): Promise<DungeonRun>;
  getDungeonRun(id: number): Promise<DungeonRun | undefined>;
  updateDungeonRun(id: number, updates: Partial<InsertDungeonRun>): Promise<DungeonRun>;
  getActiveDungeonRun(playerId?: number): Promise<DungeonRun | undefined>;
  
  // Burblemon species operations
  getAllBurblemonSpecies(): Promise<BurblemonSpecies[]>;
  getBurblemonSpeciesById(id: number): Promise<BurblemonSpecies | undefined>;
  getBurblemonSpeciesByName(name: string): Promise<BurblemonSpecies | undefined>;
  createBurblemonSpecies(species: InsertBurblemonSpecies): Promise<BurblemonSpecies>;
  
  // Player Burblemon operations
  getPlayerBurblemons(userId: number): Promise<PlayerBurblemon[]>;
  getPlayerBurblemonById(id: number): Promise<PlayerBurblemon | undefined>;
  createPlayerBurblemon(burblemon: InsertPlayerBurblemon): Promise<PlayerBurblemon>;
  updatePlayerBurblemon(id: number, updates: Partial<InsertPlayerBurblemon>): Promise<PlayerBurblemon>;
  levelUpBurblemon(id: number): Promise<PlayerBurblemon>;
  evolveBurblemon(id: number, newSpeciesId: number): Promise<PlayerBurblemon>;
  healBurblemon(id: number): Promise<PlayerBurblemon>;
  gainBurblemonXP(burblemonId: number, xp: number): Promise<void>;
  getPlayerStarterBurblemons(userId: number): Promise<PlayerBurblemon[]>;
  
  // Geography game operations
  getAllGeoMaps(): Promise<GeoMap[]>;
  getGeoMapById(id: number): Promise<GeoMap | undefined>;
  getGeoMapByKey(key: string): Promise<GeoMapWithRegions | undefined>;
  createGeoMap(map: InsertGeoMap): Promise<GeoMap>;
  getGeoRegionsByMap(mapId: number): Promise<GeoRegion[]>;
  createGeoRegion(region: InsertGeoRegion): Promise<GeoRegion>;
  submitGeoGameResult(result: InsertGeoGameResult): Promise<GeoGameResult>;
  getPlayerGeoHighScores(userId: number, mapId?: number): Promise<GeoGameResult[]>;
  getGeoLeaderboard(mapId: number, limit?: number): Promise<GeoGameResult[]>;
  
  // Map zones and progression
  getAllMapZones(): Promise<MapZone[]>;
  getMapZoneById(id: number): Promise<MapZone | undefined>;
  getMapZonesByDifficulty(difficulty: number): Promise<MapZone[]>;
  createMapZone(zone: InsertMapZone): Promise<MapZone>;
  getZonePaths(fromZoneId?: number): Promise<ZonePath[]>;
  createZonePath(path: InsertZonePath): Promise<ZonePath>;
  getPlayerMapProgress(userId: number): Promise<PlayerMapProgress | undefined>;
  createOrUpdatePlayerMapProgress(progress: InsertPlayerMapProgress): Promise<PlayerMapProgress>;
  unlockZoneForPlayer(userId: number, zoneId: number): Promise<void>;
  
  // Wild encounters
  getWildEncountersByZone(zoneId: number): Promise<WildEncounter[]>;
  createWildEncounter(encounter: InsertWildEncounter): Promise<WildEncounter>;
  generateRandomWildEncounter(zoneId: number): Promise<BurblemonSpecies | undefined>;
  
  // Items and inventory
  getAllItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | undefined>;
  getItemsByType(itemType: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  getPlayerInventory(userId: number): Promise<PlayerInventory[]>;
  addItemToInventory(userId: number, itemId: number, quantity: number): Promise<PlayerInventory>;
  removeItemFromInventory(userId: number, itemId: number, quantity: number): Promise<boolean>;
  useItem(userId: number, itemId: number, targetBurblemonId?: number): Promise<{ success: boolean; message: string }>;
  
  // Economy operations
  getPlayerEconomy(userId: number): Promise<PlayerEconomy | undefined>;
  createPlayerEconomy(economy: InsertPlayerEconomy): Promise<PlayerEconomy>;
  updatePlayerMoney(userId: number, amount: number): Promise<PlayerEconomy>;
  processPurchase(userId: number, itemId: number, quantity: number): Promise<{ success: boolean; message: string }>;
  
  // Battle records
  getBattleRecords(userId: number): Promise<BattleRecord[]>;
  createBattleRecord(record: InsertBattleRecord): Promise<BattleRecord>;
  getPlayerBattleStats(userId: number): Promise<{ wins: number; losses: number; totalBattles: number }>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private riddles: Map<number, Riddle>;
  private userProgress: Map<number, UserProgress>;
  private userFavorites: Map<number, UserFavorite>;
  private audioTracks: Map<number, AudioTrack>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private riddleIdCounter: number;
  private progressIdCounter: number;
  private favoriteIdCounter: number;
  private audioTrackIdCounter: number;
  
  public sessionStore: any;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.riddles = new Map();
    this.userProgress = new Map();
    this.userFavorites = new Map();
    this.audioTracks = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.riddleIdCounter = 1;
    this.progressIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.audioTrackIdCounter = 1;
    
    // Initialize session store
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with a guest user
    this.createUser({ username: "guest", password: "guest" });
    
    // Initialize with categories
    this.initializeData();
  }
  
  private initializeData() {
    // Create categories
    const logicCategory = this.createCategorySync({ 
      name: "Logic Puzzles", 
      description: "Test your logical thinking",
      colorClass: "primary" 
    });
    
    const wordCategory = this.createCategorySync({ 
      name: "Word Riddles", 
      description: "Play with words and meanings",
      colorClass: "secondary" 
    });
    
    const mathCategory = this.createCategorySync({ 
      name: "Math Puzzles", 
      description: "Numbers and mathematical thinking",
      colorClass: "accent" 
    });
    
    const visualCategory = this.createCategorySync({ 
      name: "Visual Puzzles", 
      description: "Puzzles that challenge your visual perception",
      colorClass: "warning" 
    });
    
    const lateralCategory = this.createCategorySync({ 
      name: "Lateral Thinking", 
      description: "Think outside the box",
      colorClass: "dark" 
    });
    
    const evSpecialCategory = this.createCategorySync({ 
      name: "EV Special", 
      description: "Guess the hidden subject with yes/no questions",
      colorClass: "success" 
    });
    
    // Create riddles
    
    // Word Riddles
    this.createRiddleSync({
      question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
      answer: "echo",
      hint: "Think about something that repeats what you say.",
      explanation: "An echo is a sound that speaks without a mouth and hears without ears. It has no physical form but comes alive with the wind or air that carries the sound.",
      categoryId: wordCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "I'm tall when I'm young, and I'm short when I'm old. What am I?",
      answer: "candle",
      hint: "Think about something that burns.",
      explanation: "A candle is tall when it's new (young) but gets shorter as it burns down (gets old).",
      categoryId: wordCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "What has keys but no locks, space but no room, and you can enter but not go in?",
      answer: "keyboard",
      hint: "You use it every day when typing.",
      explanation: "A keyboard has keys but doesn't have locks. It has a space bar but not a room, and you can press enter but not physically go in.",
      categoryId: wordCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "What gets wetter as it dries?",
      answer: "towel",
      hint: "You use it after showering.",
      explanation: "A towel gets wetter as it dries you or other things.",
      categoryId: wordCategory.id,
      difficulty: "medium"
    });
    
    // Logic Puzzles
    this.createRiddleSync({
      question: "If you have me, you want to share me. If you share me, you haven't got me. What am I?",
      answer: "secret",
      hint: "It's something valuable you can't physically touch.",
      explanation: "A secret is something you have but once you share it, it's no longer a secret.",
      categoryId: logicCategory.id,
      difficulty: "hard"
    });
    
    this.createRiddleSync({
      question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
      answer: "map",
      hint: "You use it to find your way.",
      explanation: "A map has representations of cities, mountains, and water, but not the physical houses, trees, or fish.",
      categoryId: logicCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "The more you take, the more you leave behind. What am I?",
      answer: "footsteps",
      hint: "Think about walking.",
      explanation: "As you walk and take more steps, you leave more footsteps behind you.",
      categoryId: logicCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "What can travel around the world while staying in a corner?",
      answer: "stamp",
      hint: "Think about mailing a letter.",
      explanation: "A stamp stays in the corner of an envelope but can travel around the world through the mail system.",
      categoryId: logicCategory.id,
      difficulty: "medium"
    });
    
    // Math Puzzles
    this.createRiddleSync({
      question: "If 1=5, 2=10, 3=15, and 4=20, then 5=?",
      answer: "25",
      hint: "Look for the pattern in the equation.",
      explanation: "Each number is being multiplied by 5, so 5×5=25.",
      categoryId: mathCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "A farmer has 17 sheep. All but 9 die. How many sheep are left?",
      answer: "9",
      hint: "Read the question carefully.",
      explanation: "The phrase 'all but 9 die' means that 9 sheep survived, not that 9 sheep died.",
      categoryId: mathCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "If you multiply this number by any other number, the answer will always be the same. What number is it?",
      answer: "0",
      hint: "Think about special properties of numbers.",
      explanation: "When you multiply any number by zero, the result is always zero.",
      categoryId: mathCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "Using only addition, how can you use eight eights to get the number 1000?",
      answer: "888 + 88 + 8 + 8 + 8",
      hint: "Try different place values.",
      explanation: "888 + 88 + 8 + 8 + 8 = 1000, using eight '8' digits in total.",
      categoryId: mathCategory.id,
      difficulty: "hard"
    });
    
    // Visual Puzzles
    this.createRiddleSync({
      question: "What 5-letter word becomes shorter when you add two letters to it?",
      answer: "short",
      hint: "The word itself is an adjective describing length.",
      explanation: "The word 'short' becomes 'shorter' when you add 'er' to it.",
      categoryId: visualCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "What word in the English language does the following: The first two letters signify a male, the first three letters signify a female, the first four letters signify a great person, while the entire word signifies a great woman?",
      answer: "heroine",
      hint: "Break down the word by the number of letters specified.",
      explanation: "'He' is male, 'her' is female, 'hero' is a great person, and 'heroine' is a great woman.",
      categoryId: visualCategory.id,
      difficulty: "hard"
    });
    
    // Lateral Thinking
    this.createRiddleSync({
      question: "A man leaves home, takes three left turns, and returns home facing the same direction as when he left. There are two masked men waiting for him. Who are they?",
      answer: "catcher and umpire",
      hint: "Think about sports.",
      explanation: "This describes a baseball scenario. After hitting the ball, the batter runs around the bases (3 left turns) to home plate, where the catcher and umpire (wearing masks) are waiting.",
      categoryId: lateralCategory.id,
      difficulty: "hard"
    });
    
    this.createRiddleSync({
      question: "A doctor and a boy were fishing. The boy was the doctor's son, but the doctor was not the boy's father. Who was the doctor?",
      answer: "mother",
      hint: "Don't make assumptions about the doctor.",
      explanation: "The doctor was the boy's mother.",
      categoryId: lateralCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "What has a head and a tail, but no body?",
      answer: "coin",
      hint: "It's something you might have in your pocket.",
      explanation: "A coin has a head side and a tail side, but no body.",
      categoryId: wordCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "I have branches, but no fruit, trunk, or leaves. What am I?",
      answer: "bank",
      hint: "Think about different meanings of the word 'branch'.",
      explanation: "A bank has branches (locations), but these aren't the same as tree branches with fruit, trunks, or leaves.",
      categoryId: wordCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "The more you take, the more you leave behind. What am I?",
      answer: "footsteps",
      hint: "Think about walking.",
      explanation: "When you walk, the more steps you take, the more footprints you leave behind.",
      categoryId: logicCategory.id,
      difficulty: "medium"
    });
    
    // EV Special riddles
    this.createRiddleSync({
      question: "Guess the movie: This movie is animated, has 2 main characters, is widely known, is for kids/family, and the main character is not human.",
      answer: "Shrek",
      hint: "It's about an ogre who lives in a swamp.",
      explanation: "Shrek is an animated movie with two main characters (Shrek and Donkey), is very popular, made for families, and the main character is an ogre.",
      categoryId: evSpecialCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "Guess the character: This character is from a popular TV show, wears distinctive clothing, has supernatural abilities, and is known for a catchphrase.",
      answer: "Superman",
      hint: "He wears a red cape and blue suit.",
      explanation: "Superman is from various TV shows, wears a distinctive blue suit with red cape, has many superpowers, and is known for phrases like 'Up, up and away!'",
      categoryId: evSpecialCategory.id,
      difficulty: "easy"
    });
    
    this.createRiddleSync({
      question: "Guess the animal: This animal lives in water, has no backbone, has eight limbs, and is known for its intelligence.",
      answer: "Octopus",
      hint: "It can change color and squeeze through tight spaces.",
      explanation: "An octopus lives in the ocean, is an invertebrate (no backbone), has eight tentacles, and is considered one of the most intelligent sea creatures.",
      categoryId: evSpecialCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "Guess the place: This location is man-made, very tall, located in a major city, and is a popular tourist attraction.",
      answer: "Eiffel Tower",
      hint: "It's in a European capital city known for romance.",
      explanation: "The Eiffel Tower is a man-made structure in Paris, France. It's very tall, located in a major city, and is one of the most visited tourist attractions in the world.",
      categoryId: evSpecialCategory.id,
      difficulty: "medium"
    });
    
    this.createRiddleSync({
      question: "Guess the item: This object is found in most homes, used daily, comes in different sizes, and can store things.",
      answer: "Refrigerator",
      hint: "It keeps things cold.",
      explanation: "A refrigerator is found in most homes, used daily to store and preserve food, comes in various sizes, and is designed for storage.",
      categoryId: evSpecialCategory.id,
      difficulty: "easy"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async removeUsersByEmail(emailPattern: string): Promise<void> {
    const usersToRemove = Array.from(this.users.values())
      .filter(user => user.email && user.email.toLowerCase().includes(emailPattern.toLowerCase()));
    
    for (const user of usersToRemove) {
      console.log(`Removing user with inappropriate email: ${user.username} (ID: ${user.id})`);
      this.users.delete(user.id);
      
      // Also remove all user progress and favorites
      for (const [id, progress] of this.userProgress.entries()) {
        if (progress.userId === user.id) {
          this.userProgress.delete(id);
        }
      }
      
      for (const [id, favorite] of this.userFavorites.entries()) {
        if (favorite.userId === user.id) {
          this.userFavorites.delete(id);
        }
      }
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      username: user.username,
      password: user.password,
      email: user.email || null,
      isVerified: user.isVerified || false,
      verificationToken: user.verificationToken || null,
      tokenExpiry: user.tokenExpiry || null,
      id, 
      score: 0, 
      solvedCount: 0, 
      avgTimeSeconds: 0,
      emojiGuessCount: 0,
      burbleCount: 0,
      valentineCount: 0,
      brainTeaserCount: 0
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUserScore(userId: number, scoreChange: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { 
      ...user, 
      score: user.score + scoreChange 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    for (const category of this.categories.values()) {
      if (category.name === name) {
        return category;
      }
    }
    return undefined;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { 
      name: category.name,
      description: category.description || null,
      colorClass: category.colorClass,
      id 
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Synchronous version for initialization
  private createCategorySync(category: InsertCategory): Category {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { 
      name: category.name,
      description: category.description || null,
      colorClass: category.colorClass,
      id 
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Riddle operations
  async getAllRiddles(): Promise<Riddle[]> {
    return Array.from(this.riddles.values());
  }
  
  async getRiddleById(id: number): Promise<Riddle | undefined> {
    return this.riddles.get(id);
  }
  
  async getRiddlesByCategory(categoryId: number): Promise<Riddle[]> {
    return Array.from(this.riddles.values())
      .filter(riddle => riddle.categoryId === categoryId);
  }
  
  async getRiddlesWithCategories(): Promise<RiddleWithCategory[]> {
    const riddlesArray = Array.from(this.riddles.values());
    return Promise.all(
      riddlesArray.map(async (riddle) => {
        const category = await this.getCategoryById(riddle.categoryId);
        return {
          ...riddle,
          category: {
            name: category?.name || "Unknown",
            colorClass: category?.colorClass || "primary"
          }
        };
      })
    );
  }
  
  async createRiddle(riddle: InsertRiddle): Promise<Riddle> {
    const id = this.riddleIdCounter++;
    const newRiddle: Riddle = { 
      ...riddle, 
      id, 
      avgSolveTimeSeconds: 0 
    };
    this.riddles.set(id, newRiddle);
    return newRiddle;
  }

  // Synchronous version for initialization
  private createRiddleSync(riddle: InsertRiddle): Riddle {
    const id = this.riddleIdCounter++;
    const newRiddle: Riddle = { 
      ...riddle, 
      id, 
      avgSolveTimeSeconds: 0 
    };
    this.riddles.set(id, newRiddle);
    return newRiddle;
  }
  
  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
  }
  
  async getUserRiddleProgress(userId: number, riddleId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values())
      .find(progress => progress.userId === userId && progress.riddleId === riddleId);
  }
  
  async createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Check if an entry already exists
    const existingProgress = await this.getUserRiddleProgress(
      progress.userId, 
      progress.riddleId
    );
    
    if (existingProgress) {
      // Update existing entry
      const updatedProgress: UserProgress = {
        ...existingProgress,
        ...progress,
        solvedAt: progress.solved ? new Date() : existingProgress.solvedAt
      };
      this.userProgress.set(existingProgress.id, updatedProgress);
      
      // Update user stats if solved
      if (progress.solved && !existingProgress.solved) {
        await this.updateUserStatsAfterSolve(progress.userId, progress.timeToSolveSeconds || 0, progress.riddleId);
      }
      
      return updatedProgress;
    } else {
      // Create new entry
      const id = this.progressIdCounter++;
      const newProgress: UserProgress = {
        ...progress,
        id,
        solvedAt: progress.solved ? new Date() : undefined
      };
      this.userProgress.set(id, newProgress);
      
      // Update user stats if solved
      if (progress.solved) {
        await this.updateUserStatsAfterSolve(progress.userId, progress.timeToSolveSeconds || 0, progress.riddleId);
      }
      
      return newProgress;
    }
  }
  
  private async updateUserStatsAfterSolve(userId: number, timeToSolveSeconds: number, riddleId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    const newSolvedCount = user.solvedCount + 1;
    const newAvgTime = Math.round(
      (user.avgTimeSeconds * user.solvedCount + timeToSolveSeconds) / newSolvedCount
    );

    // Get the riddle to determine its category
    const riddle = await this.getRiddleById(riddleId);
    if (!riddle) return;

    // Get the category to determine the game type
    const category = await this.getCategoryById(riddle.categoryId);
    if (!category) return;

    // Initialize game-specific counters with current values
    let burbleCount = user.burbleCount || 0;
    let valentineCount = user.valentineCount || 0;
    let emojiCount = user.emojiCount || 0;
    let brainTeaserCount = user.brainTeaserCount || 0;
    let triviaCount = user.triviaCount || 0;
    let animalTriviaCount = user.animalTriviaCount || 0;

    // Increment the appropriate counter based on category name
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes('burble')) {
      burbleCount++;
    } else if (categoryName.includes('valentine') || categoryName.includes('ev special')) {
      valentineCount++;
    } else if (categoryName.includes('emoji')) {
      emojiCount++;
    } else {
      // Default to brain teaser for all other categories
      brainTeaserCount++;
    }
    
    const updatedUser: User = {
      ...user,
      solvedCount: newSolvedCount,
      avgTimeSeconds: newAvgTime,
      burbleCount,
      valentineCount,
      emojiCount,
      brainTeaserCount,
      triviaCount,
      animalTriviaCount
    };
    
    this.users.set(userId, updatedUser);
  }
  
  async getUserStats(userId: number): Promise<{ score: number; solvedCount: number; avgTimeSeconds: number; }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      score: user.score,
      solvedCount: user.solvedCount,
      avgTimeSeconds: user.avgTimeSeconds
    };
  }
  
  // Get all users for leaderboard
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => b.score - a.score);
  }
  
  // User favorite operations
  async getUserFavorites(userId: number): Promise<FavoriteWithRiddleAndCategory[]> {
    const favorites: FavoriteWithRiddleAndCategory[] = [];
    
    for (const favorite of this.userFavorites.values()) {
      if (favorite.userId === userId) {
        const riddle = await this.getRiddleById(favorite.riddleId);
        if (riddle) {
          const category = await this.getCategoryById(riddle.categoryId);
          if (category) {
            favorites.push({
              ...favorite,
              riddle: {
                ...riddle,
                category: {
                  name: category.name,
                  colorClass: category.colorClass
                }
              }
            });
          }
        }
      }
    }
    
    // Sort by most recently added
    return favorites.sort((a, b) => {
      const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return dateB - dateA;
    });
  }
  
  async toggleUserFavorite(userId: number, riddleId: number): Promise<{ added: boolean }> {
    // Check if already favorited
    const existingFavorite = this.findFavoriteByUserAndRiddle(userId, riddleId);
    
    if (existingFavorite) {
      // Remove favorite
      this.userFavorites.delete(existingFavorite.id);
      return { added: false };
    } else {
      // Add favorite
      const id = this.favoriteIdCounter++;
      const newFavorite: UserFavorite = {
        id,
        userId,
        riddleId,
        addedAt: new Date()
      };
      
      this.userFavorites.set(id, newFavorite);
      return { added: true };
    }
  }
  
  async isRiddleFavorited(userId: number, riddleId: number): Promise<boolean> {
    return !!this.findFavoriteByUserAndRiddle(userId, riddleId);
  }
  
  private findFavoriteByUserAndRiddle(userId: number, riddleId: number): UserFavorite | undefined {
    for (const favorite of this.userFavorites.values()) {
      if (favorite.userId === userId && favorite.riddleId === riddleId) {
        return favorite;
      }
    }
    return undefined;
  }

  // Audio track operations
  async getAllAudioTracks(): Promise<AudioTrack[]> {
    return Array.from(this.audioTracks.values());
  }

  async getAudioTrackById(id: number): Promise<AudioTrack | undefined> {
    return this.audioTracks.get(id);
  }

  async getAudioTracksByUser(userId: number): Promise<AudioTrack[]> {
    return Array.from(this.audioTracks.values())
      .filter(track => track.uploadedBy === userId);
  }

  async createAudioTrack(track: InsertAudioTrack): Promise<AudioTrack> {
    const id = this.audioTrackIdCounter++;
    const newTrack: AudioTrack = {
      ...track,
      id,
      uploadedAt: new Date(),
    };
    this.audioTracks.set(id, newTrack);
    return newTrack;
  }

  async updateAudioTrack(id: number, updates: Partial<InsertAudioTrack>): Promise<AudioTrack> {
    const existingTrack = this.audioTracks.get(id);
    if (!existingTrack) {
      throw new Error(`Audio track with ID ${id} not found`);
    }
    
    const updatedTrack: AudioTrack = {
      ...existingTrack,
      ...updates,
    };
    this.audioTracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async deleteAudioTrack(id: number): Promise<void> {
    if (!this.audioTracks.has(id)) {
      throw new Error(`Audio track with ID ${id} not found`);
    }
    this.audioTracks.delete(id);
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(userId: number, updates: Partial<InsertUser>): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      return updatedUser || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }
  
  async updateUserScore(userId: number, scoreChange: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ score: user.score + scoreChange })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  async updateBotBattleResult(userId: number, won: boolean): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const botWins = (user.botWins || 0) + (won ? 1 : 0);
    const botLosses = (user.botLosses || 0) + (won ? 0 : 1);
    let botDifficultyLevel = user.botDifficultyLevel || 1;

    // Increase difficulty after 2 consecutive wins, but cap at level 10
    if (won) {
      const recentWins = Math.max(0, botWins - botLosses);
      if (recentWins > 0 && recentWins % 2 === 0 && botDifficultyLevel < 10) {
        botDifficultyLevel = Math.min(10, botDifficultyLevel + 1);
      }
    } else {
      // Decrease difficulty after 3 consecutive losses, but don't go below level 1
      const recentLosses = Math.max(0, botLosses - botWins);
      if (recentLosses > 0 && recentLosses % 3 === 0 && botDifficultyLevel > 1) {
        botDifficultyLevel = Math.max(1, botDifficultyLevel - 1);
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ 
        botWins,
        botLosses,
        botDifficultyLevel
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }
  
  async removeUsersByEmail(emailPattern: string): Promise<void> {
    // Find users with the specified email pattern
    const usersToRemove = await db
      .select()
      .from(users)
      .where(
        sql`${users.email} ILIKE ${`%${emailPattern}%`}`
      );
    
    // Log the users being removed
    for (const user of usersToRemove) {
      console.log(`Removing user with inappropriate email: ${user.username} (ID: ${user.id})`);
      
      // Delete user favorites
      await db
        .delete(userFavorites)
        .where(eq(userFavorites.userId, user.id));
      
      // Delete user progress
      await db
        .delete(userProgress)
        .where(eq(userProgress.userId, user.id));
      
      // Delete the user
      await db
        .delete(users)
        .where(eq(users.id, user.id));
    }
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  // Riddle operations
  async getAllRiddles(): Promise<Riddle[]> {
    return db.select().from(riddles);
  }
  
  async getRiddleById(id: number): Promise<Riddle | undefined> {
    const [riddle] = await db.select().from(riddles).where(eq(riddles.id, id));
    return riddle;
  }
  
  async getRiddlesByCategory(categoryId: number): Promise<Riddle[]> {
    return db.select().from(riddles).where(eq(riddles.categoryId, categoryId));
  }
  
  async getRiddlesWithCategories(): Promise<RiddleWithCategory[]> {
    const result = await db.select({
      id: riddles.id,
      question: riddles.question,
      answer: riddles.answer,
      hint: riddles.hint,
      explanation: riddles.explanation,
      imageUrl: riddles.imageUrl,
      categoryId: riddles.categoryId,
      difficulty: riddles.difficulty,
      avgSolveTimeSeconds: riddles.avgSolveTimeSeconds,
      categoryName: categories.name,
      categoryColorClass: categories.colorClass
    })
    .from(riddles)
    .innerJoin(categories, eq(riddles.categoryId, categories.id));
    
    return result.map(r => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      hint: r.hint,
      explanation: r.explanation,
      imageUrl: r.imageUrl,
      categoryId: r.categoryId,
      difficulty: r.difficulty,
      avgSolveTimeSeconds: r.avgSolveTimeSeconds,
      category: {
        name: r.categoryName,
        colorClass: r.categoryColorClass
      }
    }));
  }
  
  async createRiddle(riddle: InsertRiddle): Promise<Riddle> {
    const [newRiddle] = await db.insert(riddles).values({
      ...riddle,
      avgSolveTimeSeconds: 0
    }).returning();
    
    return newRiddle;
  }
  
  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  
  async getUserRiddleProgress(userId: number, riddleId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.riddleId, riddleId)
      ));
      
    return progress;
  }
  
  async createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const existingProgress = await this.getUserRiddleProgress(
      progress.userId, 
      progress.riddleId
    );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(userProgress)
        .set(progress)
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
        
      // Update user stats if newly solved
      if (progress.solved && !existingProgress.solved) {
        await this.updateUserStatsAfterSolve(
          progress.userId, 
          progress.timeToSolveSeconds || 0,
          progress.riddleId
        );
      }
      
      return updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(userProgress)
        .values({
          ...progress,
          solvedAt: progress.solved ? new Date() : null
        })
        .returning();
      
      // Update user stats if solved
      if (progress.solved) {
        await this.updateUserStatsAfterSolve(
          progress.userId, 
          progress.timeToSolveSeconds || 0,
          progress.riddleId
        );
      }
      
      return newProgress;
    }
  }
  
  private async updateUserStatsAfterSolve(userId: number, timeToSolveSeconds: number, riddleId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Calculate new average solve time
    const totalSolveTime = user.avgTimeSeconds * user.solvedCount + timeToSolveSeconds;
    const newSolvedCount = user.solvedCount + 1;
    const newAvgTime = Math.round(totalSolveTime / newSolvedCount);

    // Get the riddle to determine its category
    const riddle = await this.getRiddleById(riddleId);
    if (!riddle) return;

    // Get the category to determine the game type
    const category = await this.getCategoryById(riddle.categoryId);
    if (!category) return;

    // Initialize game-specific counters with current values
    let burbleCount = user.burbleCount || 0;
    let valentineCount = user.valentineCount || 0;
    let emojiCount = user.emojiCount || 0;
    let brainTeaserCount = user.brainTeaserCount || 0;

    // Increment the appropriate counter based on category name
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes('burble')) {
      burbleCount++;
    } else if (categoryName.includes('valentine') || categoryName.includes('ev special')) {
      valentineCount++;
    } else if (categoryName.includes('emoji')) {
      emojiCount++;
    } else {
      // Default to brain teaser for all other categories
      brainTeaserCount++;
    }
    
    // Update user stats
    await db
      .update(users)
      .set({
        solvedCount: newSolvedCount,
        avgTimeSeconds: newAvgTime,
        burbleCount,
        valentineCount,
        emojiCount,
        brainTeaserCount
      })
      .where(eq(users.id, userId));
  }
  
  async getUserStats(userId: number): Promise<{ score: number; solvedCount: number; avgTimeSeconds: number; }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { score: 0, solvedCount: 0, avgTimeSeconds: 0 };
    }
    
    return {
      score: user.score,
      solvedCount: user.solvedCount,
      avgTimeSeconds: user.avgTimeSeconds
    };
  }
  
  // Get all users for leaderboard, sorted by score
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.score, 'desc');
    return allUsers;
  }
  
  // User favorite operations
  async getUserFavorites(userId: number): Promise<FavoriteWithRiddleAndCategory[]> {
    // Get user favorites with their riddles and categories
    const result = await db.select({
      id: userFavorites.id,
      userId: userFavorites.userId,
      riddleId: userFavorites.riddleId,
      addedAt: userFavorites.addedAt,
      riddleQuestion: riddles.question,
      riddleAnswer: riddles.answer,
      riddleHint: riddles.hint,
      riddleExplanation: riddles.explanation,
      riddleImageUrl: riddles.imageUrl,
      riddleCategoryId: riddles.categoryId,
      riddleDifficulty: riddles.difficulty,
      riddleAvgSolveTimeSeconds: riddles.avgSolveTimeSeconds,
      riddleCreatorName: riddles.creatorName,
      riddleIsFanMade: riddles.isFanMade,
      categoryName: categories.name,
      categoryColorClass: categories.colorClass
    })
    .from(userFavorites)
    .innerJoin(riddles, eq(userFavorites.riddleId, riddles.id))
    .innerJoin(categories, eq(riddles.categoryId, categories.id))
    .where(eq(userFavorites.userId, userId))
    .orderBy(userFavorites.addedAt, 'desc');
    
    // Transform to expected structure
    return result.map(f => ({
      id: f.id,
      userId: f.userId,
      riddleId: f.riddleId,
      addedAt: f.addedAt,
      riddle: {
        id: f.riddleId,
        question: f.riddleQuestion,
        answer: f.riddleAnswer,
        hint: f.riddleHint,
        explanation: f.riddleExplanation,
        imageUrl: f.riddleImageUrl,
        categoryId: f.riddleCategoryId,
        difficulty: f.riddleDifficulty,
        avgSolveTimeSeconds: f.riddleAvgSolveTimeSeconds,
        creatorName: f.riddleCreatorName,
        isFanMade: f.riddleIsFanMade,
        category: {
          name: f.categoryName,
          colorClass: f.categoryColorClass
        }
      }
    }));
  }
  
  async toggleUserFavorite(userId: number, riddleId: number): Promise<{ added: boolean }> {
    // Check if already favorited
    const existing = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.riddleId, riddleId)
      ));
    
    if (existing.length > 0) {
      // Remove favorite
      await db.delete(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId), 
          eq(userFavorites.riddleId, riddleId)
        ));
      return { added: false };
    } else {
      // Add favorite
      await db.insert(userFavorites)
        .values({
          userId,
          riddleId
        });
      return { added: true };
    }
  }
  
  async isRiddleFavorited(userId: number, riddleId: number): Promise<boolean> {
    const result = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.riddleId, riddleId)
      ));
    
    return result.length > 0;
  }

  // Multiplayer game operations
  async getRandomRiddlesByCategory(categoryId: number, count: number): Promise<Riddle[]> {
    return db.select()
      .from(riddles)
      .where(eq(riddles.categoryId, categoryId))
      .orderBy(sql`RANDOM()`)
      .limit(count);
  }

  async createGameSession(sessionData: InsertGameSession): Promise<GameSession> {
    const [session] = await db.insert(gameSessions).values(sessionData).returning();
    return session;
  }

  async getGameSessionByCode(sessionCode: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.sessionCode, sessionCode));
    return session;
  }

  async getGameSessionWithParticipants(sessionId: number): Promise<GameSessionWithParticipants | undefined> {
    const session = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId));
    if (session.length === 0) return undefined;

    const participants = await db.select({
      id: gameParticipants.id,
      sessionId: gameParticipants.sessionId,
      userId: gameParticipants.userId,
      score: gameParticipants.score,
      correctAnswers: gameParticipants.correctAnswers,
      totalAnswered: gameParticipants.totalAnswered,
      isReady: gameParticipants.isReady,
      joinedAt: gameParticipants.joinedAt,
      leftAt: gameParticipants.leftAt,
      hp: gameParticipants.hp,
      maxHp: gameParticipants.maxHp,
      hasShield: gameParticipants.hasShield,
      chargePower: gameParticipants.chargePower,
      lastAction: gameParticipants.lastAction,
      spriteType: gameParticipants.spriteType,
      energy: gameParticipants.energy,
      username: users.username,
      userEmail: users.email
    })
    .from(gameParticipants)
    .innerJoin(users, eq(gameParticipants.userId, users.id))
    .where(eq(gameParticipants.sessionId, sessionId));

    const category = session[0].categoryId ? await this.getCategoryById(session[0].categoryId) : undefined;

    return {
      ...session[0],
      participants: participants.map(p => ({
        id: p.id,
        sessionId: p.sessionId,
        userId: p.userId,
        score: p.score,
        correctAnswers: p.correctAnswers,
        totalAnswered: p.totalAnswered,
        isReady: p.isReady,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        hp: p.hp,
        maxHp: p.maxHp,
        hasShield: p.hasShield,
        chargePower: p.chargePower,
        lastAction: p.lastAction,
        spriteType: p.spriteType,
        energy: p.energy,
        user: {
          id: p.userId,
          username: p.username,
          email: p.userEmail,
          password: "", // Don't expose password
          isVerified: true,
          verificationToken: null,
          tokenExpiry: null,
          score: 0,
          solvedCount: 0,
          avgTimeSeconds: 0,
          burbleCount: 0,
          valentineCount: 0,
          emojiCount: 0,
          brainTeaserCount: 0
        }
      })),
      category
    };
  }

  async joinGameSession(sessionId: number, userId: number): Promise<GameParticipant> {
    // Check if user is already in session
    const existing = await db.select().from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));

    if (existing.length > 0) {
      // User already in session, return existing participant
      return existing[0];
    }

    // Insert new participant
    const [participant] = await db.insert(gameParticipants).values({
      sessionId,
      userId
    }).returning();
    return participant;
  }

  async markPlayerReady(sessionId: number, userId: number): Promise<void> {
    await db.update(gameParticipants)
      .set({ isReady: true })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async startGameSession(sessionId: number): Promise<void> {
    await db.update(gameSessions)
      .set({ 
        status: 'active',
        startedAt: new Date()
      })
      .where(eq(gameSessions.id, sessionId));
  }

  async updateGameQuestionIndex(sessionId: number, questionIndex: number): Promise<void> {
    await db.update(gameSessions)
      .set({ currentQuestionIndex: questionIndex })
      .where(eq(gameSessions.id, sessionId));
  }

  async finishGameSession(sessionId: number): Promise<void> {
    await db.update(gameSessions)
      .set({ 
        status: 'finished',
        finishedAt: new Date()
      })
      .where(eq(gameSessions.id, sessionId));
  }

  async saveGameAnswer(answerData: InsertGameAnswer): Promise<GameAnswer> {
    const [answer] = await db.insert(gameAnswers).values(answerData).returning();
    return answer;
  }

  async updateParticipantScore(sessionId: number, userId: number, points: number): Promise<void> {
    const participant = await db.select()
      .from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));

    if (participant.length > 0) {
      await db.update(gameParticipants)
        .set({ 
          score: participant[0].score + points,
          correctAnswers: participant[0].correctAnswers + 1,
          totalAnswered: participant[0].totalAnswered + 1
        })
        .where(and(
          eq(gameParticipants.sessionId, sessionId),
          eq(gameParticipants.userId, userId)
        ));
    }
  }

  async getQuestionAnswers(sessionId: number, questionIndex: number): Promise<GameAnswer[]> {
    return db.select()
      .from(gameAnswers)
      .where(and(
        eq(gameAnswers.sessionId, sessionId),
        eq(gameAnswers.questionIndex, questionIndex)
      ));
  }

  // Battle system operations
  async updateParticipantHP(sessionId: number, userId: number, newHP: number): Promise<void> {
    await db.update(gameParticipants)
      .set({ hp: Math.max(0, newHP) }) // Ensure HP doesn't go below 0
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async updateParticipantShield(sessionId: number, userId: number, hasShield: boolean): Promise<void> {
    await db.update(gameParticipants)
      .set({ hasShield })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async updateParticipantCharge(sessionId: number, userId: number, chargePower: number): Promise<void> {
    await db.update(gameParticipants)
      .set({ chargePower })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async updateParticipantBattleAction(sessionId: number, userId: number, action: string): Promise<void> {
    await db.update(gameParticipants)
      .set({ lastAction: action })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async processBattleAction(sessionId: number, attackerId: number, targetId: number, action: string, baseDamage: number = 10): Promise<{ damage: number; shieldBroken: boolean; targetHP: number }> {
    // Get attacker and target data
    const [attacker] = await db.select()
      .from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, attackerId)
      ));

    const [target] = await db.select()
      .from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, targetId)
      ));

    if (!attacker || !target) {
      throw new Error('Participant not found');
    }

    let damage = 0;
    let shieldBroken = false;
    let targetHP = target.hp;

    if (action === 'attack') {
      // Calculate damage with charge bonus
      damage = baseDamage + attacker.chargePower;
      
      if (target.hasShield) {
        // Shield blocks the attack
        shieldBroken = true;
        damage = 0;
        // Remove shield from target
        await this.updateParticipantShield(sessionId, targetId, false);
      } else {
        // Deal damage to target
        targetHP = Math.max(0, target.hp - damage);
        await this.updateParticipantHP(sessionId, targetId, targetHP);
      }
      
      // Reset attacker's charge after attack
      await this.updateParticipantCharge(sessionId, attackerId, 0);
    }

    return { damage, shieldBroken, targetHP };
  }

  async resetParticipantBattleStats(sessionId: number, userId: number): Promise<void> {
    const [participant] = await db.select()
      .from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));

    if (participant) {
      const spriteInfo = this.getSpriteInfo(participant.spriteType || 'balanced');
      await db.update(gameParticipants)
        .set({ 
          hp: spriteInfo.startingHp,
          maxHp: spriteInfo.startingHp,
          hasShield: false,
          chargePower: 0,
          lastAction: null,
          energy: spriteInfo.startingEnergy
        })
        .where(and(
          eq(gameParticipants.sessionId, sessionId),
          eq(gameParticipants.userId, userId)
        ));
    }
  }

  // Sprite system operations
  async updateParticipantSprite(sessionId: number, userId: number, spriteType: string): Promise<void> {
    const spriteInfo = this.getSpriteInfo(spriteType);
    await db.update(gameParticipants)
      .set({ 
        spriteType,
        hp: spriteInfo.startingHp,
        maxHp: spriteInfo.startingHp,
        energy: spriteInfo.startingEnergy
      })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  async updateParticipantEnergy(sessionId: number, userId: number, energyDelta: number): Promise<void> {
    const [participant] = await db.select()
      .from(gameParticipants)
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));

    if (participant) {
      const newEnergy = Math.max(0, participant.energy + energyDelta);
      await db.update(gameParticipants)
        .set({ energy: newEnergy })
        .where(and(
          eq(gameParticipants.sessionId, sessionId),
          eq(gameParticipants.userId, userId)
        ));
    }
  }

  getSpriteInfo(spriteType: string): { startingHp: number; startingEnergy: number; correctBonus: number; incorrectPenalty: number; hasReflect?: boolean } {
    switch (spriteType) {
      case 'big_brain':
        return {
          startingHp: 50,
          startingEnergy: 5, // Starts with 5 energy
          correctBonus: 5,   // +5 energy for correct answers
          incorrectPenalty: 5, // Normal HP loss for wrong answers
          hasReflect: false
        };
      case 'risk_taker':
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,   // +5 energy when correct
          incorrectPenalty: 15, // -15 HP when wrong (instead of -5)
          hasReflect: false
        };
      case 'tank':
        return {
          startingHp: 100,    // Starts with 100 HP instead of 50
          startingEnergy: 0,
          correctBonus: 5,    // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: false
        };
      case 'reflector':
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,    // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: true    // Can use reflect instead of shield
        };
      default: // balanced
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,    // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: false
        };
    }
  }

  // Bot functionality
  async createBotUser(): Promise<User> {
    const botUsername = `Bot_${Math.random().toString(36).substring(2, 8)}`;
    const [bot] = await db
      .insert(users)
      .values({
        username: botUsername,
        password: 'bot_password', // Dummy password for bot
        email: `${botUsername}@bot.ai`,
        isVerified: true,
      })
      .returning();
    return bot;
  }

  async addBotToSession(sessionId: number, hostUserId?: number): Promise<GameParticipant> {
    const bot = await this.createBotUser();
    const spriteTypes = ['big_brain', 'risk_taker', 'tank', 'reflector', 'balanced'];
    const randomSprite = spriteTypes[Math.floor(Math.random() * spriteTypes.length)];
    const spriteInfo = this.getSpriteInfo(randomSprite);
    
    // Get host's bot difficulty level to scale bot stats
    let difficultyMultiplier = 1.0;
    if (hostUserId) {
      const host = await this.getUser(hostUserId);
      if (host) {
        const botLevel = host.botDifficultyLevel || 1;
        // Scale difficulty: Level 1 = 1.0x, Level 10 = 2.0x
        difficultyMultiplier = 1.0 + ((botLevel - 1) * 0.11); // 0.11 per level = +10% per level
      }
    }
    
    // Scale bot stats based on difficulty
    const scaledHp = Math.round(spriteInfo.startingHp * difficultyMultiplier);
    const scaledEnergy = Math.round(spriteInfo.startingEnergy * difficultyMultiplier);
    
    const [participant] = await db
      .insert(gameParticipants)
      .values({
        sessionId,
        userId: bot.id,
        hp: scaledHp,
        maxHp: scaledHp,
        energy: scaledEnergy,
        spriteType: randomSprite,
        isReady: true, // Bots are always ready
      })
      .returning();

    return { ...participant, user: bot };
  }

  async getBotAnswer(riddle: Riddle): Promise<{ answer: string; isCorrect: boolean; timeToAnswer: number }> {
    // Simple bot AI - 70% chance to get it right
    const isCorrect = Math.random() < 0.7;
    const timeToAnswer = Math.floor(Math.random() * 15) + 5; // 5-20 seconds
    
    let answer = '';
    if (isCorrect) {
      // Bot gets it right - use the actual answer
      answer = riddle.answer;
    } else {
      // Bot gets it wrong - generate a plausible wrong answer
      answer = `Wrong answer ${Math.floor(Math.random() * 100)}`;
    }
    
    return { answer, isCorrect, timeToAnswer };
  }

  async getBotBattleAction(participant: GameParticipant): Promise<string> {
    const energy = participant.energy || 0;
    const availableActions = [];
    
    if (energy >= 5) availableActions.push('attack');
    if (energy >= 2) availableActions.push('charge');
    
    // Check if bot has reflect ability
    const spriteInfo = this.getSpriteInfo(participant.spriteType || 'balanced');
    if (spriteInfo.hasReflect && energy >= 5) {
      availableActions.push('reflect');
    } else if (energy >= 3) {
      availableActions.push('shield');
    }
    
    if (availableActions.length === 0) return 'skip';
    
    // Simple AI: prefer attack if available, otherwise random
    if (availableActions.includes('attack') && Math.random() < 0.6) {
      return 'attack';
    }
    
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }

  async initializeParticipantWithSprite(sessionId: number, userId: number, spriteType: string): Promise<void> {
    const spriteInfo = this.getSpriteInfo(spriteType);
    await db.update(gameParticipants)
      .set({
        spriteType,
        hp: spriteInfo.startingHp,
        maxHp: spriteInfo.startingHp,
        energy: spriteInfo.startingEnergy,
        hasShield: false,
        chargePower: 0,
        lastAction: null
      })
      .where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
  }

  // Audio track operations
  async getAllAudioTracks(): Promise<AudioTrack[]> {
    const tracks = await db.select().from(audioTracks);
    return tracks;
  }

  async getAudioTrackById(id: number): Promise<AudioTrack | undefined> {
    const [track] = await db.select().from(audioTracks).where(eq(audioTracks.id, id));
    return track;
  }

  async getAudioTracksByUser(userId: number): Promise<AudioTrack[]> {
    const tracks = await db.select().from(audioTracks).where(eq(audioTracks.uploadedBy, userId));
    return tracks;
  }

  async createAudioTrack(track: InsertAudioTrack): Promise<AudioTrack> {
    const [newTrack] = await db.insert(audioTracks).values(track).returning();
    return newTrack;
  }

  async updateAudioTrack(id: number, updates: Partial<InsertAudioTrack>): Promise<AudioTrack> {
    const [updatedTrack] = await db
      .update(audioTracks)
      .set(updates)
      .where(eq(audioTracks.id, id))
      .returning();
    
    if (!updatedTrack) {
      throw new Error(`Audio track with ID ${id} not found`);
    }
    
    return updatedTrack;
  }

  async deleteAudioTrack(id: number): Promise<void> {
    const result = await db.delete(audioTracks).where(eq(audioTracks.id, id));
    // Note: Drizzle doesn't provide affected rows count, so we assume success
  }

  // Quiz operations for solo dungeon
  async getAllQuizTopics(): Promise<QuizTopic[]> {
    return db.select().from(quizTopics);
  }

  async getQuizTopicById(id: number): Promise<QuizTopic | undefined> {
    const [topic] = await db.select().from(quizTopics).where(eq(quizTopics.id, id));
    return topic;
  }

  async getQuizTopicWithQuestions(id: number): Promise<QuizTopicWithQuestions | undefined> {
    const topic = await this.getQuizTopicById(id);
    if (!topic) return undefined;

    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, id));
    return { ...topic, questions };
  }

  async createQuizTopic(topic: InsertQuizTopic): Promise<QuizTopic> {
    const [newTopic] = await db.insert(quizTopics).values(topic).returning();
    return newTopic;
  }

  async getQuestionsByTopic(topicId: number, difficulty?: string, limit: number = 10): Promise<QuizQuestion[]> {
    let whereConditions = [eq(quizQuestions.topicId, topicId)];
    
    if (difficulty) {
      whereConditions.push(eq(quizQuestions.difficulty, difficulty));
    }

    const questions = await db.select()
      .from(quizQuestions)
      .where(and(...whereConditions))
      .limit(limit);
    
    return questions;
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async validateQuizAnswer(questionId: number, userAnswer: string): Promise<{ isCorrect: boolean; explanation?: string; energyReward: number }> {
    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId));
    
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }

    const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    
    return {
      isCorrect,
      explanation: question.explanation || undefined,
      energyReward: isCorrect ? question.energyReward : 0
    };
  }

  // Dungeon run operations
  async createDungeonRun(run: InsertDungeonRun): Promise<DungeonRun> {
    const [newRun] = await db.insert(dungeonRuns).values(run).returning();
    return newRun;
  }

  async getDungeonRun(id: number): Promise<DungeonRun | undefined> {
    const [run] = await db.select().from(dungeonRuns).where(eq(dungeonRuns.id, id));
    return run;
  }

  async updateDungeonRun(id: number, updates: Partial<InsertDungeonRun>): Promise<DungeonRun> {
    const [updatedRun] = await db
      .update(dungeonRuns)
      .set(updates)
      .where(eq(dungeonRuns.id, id))
      .returning();
    
    if (!updatedRun) {
      throw new Error(`Dungeon run with ID ${id} not found`);
    }
    
    return updatedRun;
  }

  async getActiveDungeonRun(playerId?: number): Promise<DungeonRun | undefined> {
    let whereConditions = [eq(dungeonRuns.isActive, true)];
    
    if (playerId) {
      whereConditions.push(eq(dungeonRuns.playerId, playerId));
    } else {
      // For guest users (null playerId)
      whereConditions.push(sql`${dungeonRuns.playerId} IS NULL`);
    }

    const [run] = await db.select()
      .from(dungeonRuns)
      .where(and(...whereConditions))
      .limit(1);
    
    return run;
  }

  // Burblemon species operations
  async getAllBurblemonSpecies(): Promise<BurblemonSpecies[]> {
    return db.select().from(burblemonSpecies);
  }

  async getBurblemonSpeciesById(id: number): Promise<BurblemonSpecies | undefined> {
    const [species] = await db.select().from(burblemonSpecies).where(eq(burblemonSpecies.id, id));
    return species;
  }

  async getBurblemonSpeciesByName(name: string): Promise<BurblemonSpecies | undefined> {
    const [species] = await db.select().from(burblemonSpecies).where(eq(burblemonSpecies.name, name));
    return species;
  }

  async createBurblemonSpecies(species: InsertBurblemonSpecies): Promise<BurblemonSpecies> {
    const [newSpecies] = await db.insert(burblemonSpecies).values(species).returning();
    return newSpecies;
  }

  // Player Burblemon operations
  async getPlayerBurblemons(userId: number): Promise<PlayerBurblemon[]> {
    return db.select().from(playerBurblemons).where(eq(playerBurblemons.userId, userId));
  }

  async getPlayerBurblemonById(id: number): Promise<PlayerBurblemon | undefined> {
    const [burblemon] = await db.select().from(playerBurblemons).where(eq(playerBurblemons.id, id));
    return burblemon;
  }

  async createPlayerBurblemon(burblemon: InsertPlayerBurblemon): Promise<PlayerBurblemon> {
    const [newBurblemon] = await db.insert(playerBurblemons).values(burblemon).returning();
    return newBurblemon;
  }

  async updatePlayerBurblemon(id: number, updates: Partial<InsertPlayerBurblemon>): Promise<PlayerBurblemon> {
    const [updatedBurblemon] = await db
      .update(playerBurblemons)
      .set(updates)
      .where(eq(playerBurblemons.id, id))
      .returning();
    
    if (!updatedBurblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }
    
    return updatedBurblemon;
  }

  async levelUpBurblemon(id: number): Promise<PlayerBurblemon> {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }

    const newLevel = burblemon.level + 1;
    const expNeededForNextLevel = newLevel * 100; // Simple formula: level * 100 exp needed
    
    if (burblemon.experience < expNeededForNextLevel) {
      throw new Error('Not enough experience to level up');
    }

    // Calculate stat increases (10% increase per level)
    const hpIncrease = Math.floor(burblemon.maxHp * 0.1);
    const attackIncrease = Math.floor(burblemon.currentAttack * 0.1);
    const defenseIncrease = Math.floor(burblemon.currentDefense * 0.1);
    const speedIncrease = Math.floor(burblemon.currentSpeed * 0.1);

    return this.updatePlayerBurblemon(id, {
      level: newLevel,
      maxHp: burblemon.maxHp + hpIncrease,
      currentHp: burblemon.currentHp + hpIncrease,
      currentAttack: burblemon.currentAttack + attackIncrease,
      currentDefense: burblemon.currentDefense + defenseIncrease,
      currentSpeed: burblemon.currentSpeed + speedIncrease
    });
  }

  async evolveBurblemon(id: number, newSpeciesId: number): Promise<PlayerBurblemon> {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }

    const newSpecies = await this.getBurblemonSpeciesById(newSpeciesId);
    if (!newSpecies) {
      throw new Error(`Burblemon species with ID ${newSpeciesId} not found`);
    }

    // Calculate evolved stats (base stats + current level bonuses)
    const levelMultiplier = 1 + (burblemon.level - 1) * 0.1;
    const newMaxHp = Math.floor(newSpecies.baseHp * levelMultiplier);
    const newAttack = Math.floor(newSpecies.baseAttack * levelMultiplier);
    const newDefense = Math.floor(newSpecies.baseDefense * levelMultiplier);
    const newSpeed = Math.floor(newSpecies.baseSpeed * levelMultiplier);

    return this.updatePlayerBurblemon(id, {
      speciesId: newSpeciesId,
      maxHp: newMaxHp,
      currentHp: newMaxHp, // Full heal on evolution
      currentAttack: newAttack,
      currentDefense: newDefense,
      currentSpeed: newSpeed
    });
  }

  async healBurblemon(id: number): Promise<PlayerBurblemon> {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }

    return this.updatePlayerBurblemon(id, {
      currentHp: burblemon.maxHp,
      statusConditions: []
    });
  }

  async gainBurblemonXP(burblemonId: number, xp: number): Promise<void> {
    const burblemon = await this.getPlayerBurblemonById(burblemonId);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${burblemonId} not found`);
    }

    const newXP = burblemon.xp + xp;
    const xpNeededForNextLevel = burblemon.level * 100;
    
    // Check if Burblemon should level up
    if (newXP >= xpNeededForNextLevel) {
      // Level up the Burblemon
      const newLevel = burblemon.level + 1;
      const remainingXP = newXP - xpNeededForNextLevel;
      
      // Calculate stat increases (10% increase per level)
      const hpIncrease = Math.floor(burblemon.maxHp * 0.1);
      const attackIncrease = Math.floor(burblemon.attack * 0.1);
      const defenseIncrease = Math.floor(burblemon.defense * 0.1);
      const speedIncrease = Math.floor(burblemon.speed * 0.1);
      
      await this.updatePlayerBurblemon(burblemonId, {
        level: newLevel,
        xp: remainingXP,
        maxHp: burblemon.maxHp + hpIncrease,
        currentHp: burblemon.currentHp + hpIncrease, // Heal on level up
        attack: burblemon.attack + attackIncrease,
        defense: burblemon.defense + defenseIncrease,
        speed: burblemon.speed + speedIncrease,
      });
    } else {
      // Just update XP
      await this.updatePlayerBurblemon(burblemonId, {
        xp: newXP
      });
    }
  }

  async getPlayerStarterBurblemons(userId: number): Promise<PlayerBurblemon[]> {
    return db.select()
      .from(playerBurblemons)
      .where(and(
        eq(playerBurblemons.userId, userId),
        eq(playerBurblemons.isStarter, true)
      ));
  }

  // Map zones and progression
  async getAllMapZones(): Promise<MapZone[]> {
    return db.select().from(mapZones);
  }

  async getMapZoneById(id: number): Promise<MapZone | undefined> {
    const [zone] = await db.select().from(mapZones).where(eq(mapZones.id, id));
    return zone;
  }

  async getMapZonesByDifficulty(difficulty: number): Promise<MapZone[]> {
    return db.select().from(mapZones).where(eq(mapZones.difficultyLevel, difficulty));
  }

  async createMapZone(zone: InsertMapZone): Promise<MapZone> {
    const [newZone] = await db.insert(mapZones).values(zone).returning();
    return newZone;
  }

  async getZonePaths(fromZoneId?: number): Promise<ZonePath[]> {
    if (fromZoneId) {
      return db.select().from(zonePaths).where(eq(zonePaths.fromZoneId, fromZoneId));
    }
    return db.select().from(zonePaths);
  }

  async createZonePath(path: InsertZonePath): Promise<ZonePath> {
    const [newPath] = await db.insert(zonePaths).values(path).returning();
    return newPath;
  }

  async getPlayerMapProgress(userId: number): Promise<PlayerMapProgress | undefined> {
    const [progress] = await db.select().from(playerMapProgress).where(eq(playerMapProgress.userId, userId));
    return progress;
  }

  async createOrUpdatePlayerMapProgress(progress: InsertPlayerMapProgress): Promise<PlayerMapProgress> {
    const existing = await this.getPlayerMapProgress(progress.userId);
    
    if (existing) {
      const [updated] = await db
        .update(playerMapProgress)
        .set(progress)
        .where(eq(playerMapProgress.userId, progress.userId))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(playerMapProgress).values(progress).returning();
      return newProgress;
    }
  }

  async unlockZoneForPlayer(userId: number, zoneId: number): Promise<void> {
    const progress = await this.getPlayerMapProgress(userId);
    if (!progress) {
      await this.createOrUpdatePlayerMapProgress({
        userId,
        currentZoneId: zoneId,
        unlockedZones: [zoneId],
        badgesEarned: 0,
        gymLeadersDefeated: []
      });
    } else {
      const updatedZones = [...progress.unlockedZones];
      if (!updatedZones.includes(zoneId)) {
        updatedZones.push(zoneId);
      }
      
      await this.createOrUpdatePlayerMapProgress({
        ...progress,
        unlockedZones: updatedZones
      });
    }
  }

  // Wild encounters
  async getWildEncountersByZone(zoneId: number): Promise<WildEncounter[]> {
    return db.select().from(wildEncounters).where(eq(wildEncounters.zoneId, zoneId));
  }

  async createWildEncounter(encounter: InsertWildEncounter): Promise<WildEncounter> {
    const [newEncounter] = await db.insert(wildEncounters).values(encounter).returning();
    return newEncounter;
  }

  async generateRandomWildEncounter(zoneId: number): Promise<BurblemonSpecies | undefined> {
    const encounters = await this.getWildEncountersByZone(zoneId);
    if (encounters.length === 0) return undefined;

    // Weight encounters by their encounter rate
    const totalWeight = encounters.reduce((sum, enc) => sum + enc.encounterRate, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const encounter of encounters) {
      currentWeight += encounter.encounterRate;
      if (random <= currentWeight) {
        return this.getBurblemonSpeciesById(encounter.speciesId);
      }
    }
    
    return undefined;
  }

  // Items and inventory
  async getAllItems(): Promise<Item[]> {
    return db.select().from(items);
  }

  async getItemById(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemsByType(itemType: string): Promise<Item[]> {
    return db.select().from(items).where(eq(items.itemType, itemType));
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async getPlayerInventory(userId: number): Promise<PlayerInventory[]> {
    return db.select().from(playerInventory).where(eq(playerInventory.userId, userId));
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number): Promise<PlayerInventory> {
    const existing = await db.select()
      .from(playerInventory)
      .where(and(
        eq(playerInventory.userId, userId),
        eq(playerInventory.itemId, itemId)
      ));

    if (existing.length > 0) {
      const [updated] = await db
        .update(playerInventory)
        .set({ quantity: existing[0].quantity + quantity })
        .where(and(
          eq(playerInventory.userId, userId),
          eq(playerInventory.itemId, itemId)
        ))
        .returning();
      return updated;
    } else {
      const [newInventoryItem] = await db
        .insert(playerInventory)
        .values({ userId, itemId, quantity })
        .returning();
      return newInventoryItem;
    }
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number): Promise<boolean> {
    const existing = await db.select()
      .from(playerInventory)
      .where(and(
        eq(playerInventory.userId, userId),
        eq(playerInventory.itemId, itemId)
      ));

    if (existing.length === 0 || existing[0].quantity < quantity) {
      return false; // Not enough items
    }

    const newQuantity = existing[0].quantity - quantity;
    if (newQuantity === 0) {
      await db.delete(playerInventory)
        .where(and(
          eq(playerInventory.userId, userId),
          eq(playerInventory.itemId, itemId)
        ));
    } else {
      await db
        .update(playerInventory)
        .set({ quantity: newQuantity })
        .where(and(
          eq(playerInventory.userId, userId),
          eq(playerInventory.itemId, itemId)
        ));
    }

    return true;
  }

  async useItem(userId: number, itemId: number, targetBurblemonId?: number): Promise<{ success: boolean; message: string }> {
    const item = await this.getItemById(itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    const hasItem = await this.removeItemFromInventory(userId, itemId, 1);
    if (!hasItem) {
      return { success: false, message: 'You do not have this item' };
    }

    // Basic item effects - can be expanded
    switch (item.itemType) {
      case 'healing':
        if (targetBurblemonId) {
          await this.healBurblemon(targetBurblemonId);
          return { success: true, message: `Used ${item.name} to heal your Burblemon!` };
        }
        return { success: false, message: 'Select a Burblemon to heal' };
      
      case 'pokeball':
        return { success: true, message: `Used ${item.name}! (Capture logic to be implemented)` };
      
      default:
        return { success: true, message: `Used ${item.name}!` };
    }
  }

  // Economy operations
  async getPlayerEconomy(userId: number): Promise<PlayerEconomy | undefined> {
    const [economy] = await db.select().from(playerEconomy).where(eq(playerEconomy.userId, userId));
    return economy;
  }

  async createPlayerEconomy(economy: InsertPlayerEconomy): Promise<PlayerEconomy> {
    const [newEconomy] = await db.insert(playerEconomy).values(economy).returning();
    return newEconomy;
  }

  async updatePlayerMoney(userId: number, amount: number): Promise<PlayerEconomy> {
    const existing = await this.getPlayerEconomy(userId);
    
    if (!existing) {
      return this.createPlayerEconomy({
        userId,
        money: Math.max(0, amount),
        totalMoneyEarned: Math.max(0, amount),
        totalMoneySpent: 0,
        streakDays: 0
      });
    }

    const newMoney = Math.max(0, existing.money + amount);
    const totalEarned = amount > 0 ? existing.totalMoneyEarned + amount : existing.totalMoneyEarned;
    const totalSpent = amount < 0 ? existing.totalMoneySpent + Math.abs(amount) : existing.totalMoneySpent;

    const [updated] = await db
      .update(playerEconomy)
      .set({
        money: newMoney,
        totalMoneyEarned: totalEarned,
        totalMoneySpent: totalSpent
      })
      .where(eq(playerEconomy.userId, userId))
      .returning();

    return updated;
  }

  async processPurchase(userId: number, itemId: number, quantity: number): Promise<{ success: boolean; message: string }> {
    const item = await this.getItemById(itemId);
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    const economy = await this.getPlayerEconomy(userId);
    const totalCost = item.buyPrice * quantity;

    if (!economy || economy.money < totalCost) {
      return { success: false, message: 'Not enough money' };
    }

    // Deduct money and add item to inventory
    await this.updatePlayerMoney(userId, -totalCost);
    await this.addItemToInventory(userId, itemId, quantity);

    return { success: true, message: `Purchased ${quantity}x ${item.name} for ${totalCost} coins!` };
  }

  // Battle records
  async getBattleRecords(userId: number): Promise<BattleRecord[]> {
    return db.select().from(battleRecords).where(eq(battleRecords.userId, userId));
  }

  async createBattleRecord(record: InsertBattleRecord): Promise<BattleRecord> {
    const [newRecord] = await db.insert(battleRecords).values(record).returning();
    return newRecord;
  }

  async getPlayerBattleStats(userId: number): Promise<{ wins: number; losses: number; totalBattles: number }> {
    const records = await this.getBattleRecords(userId);
    const wins = records.filter(r => r.result === 'win').length;
    const losses = records.filter(r => r.result === 'loss').length;
    const totalBattles = records.length;

    return { wins, losses, totalBattles };
  }

  // Geography game operations
  async getAllGeoMaps(): Promise<GeoMap[]> {
    return db.select().from(geoMaps).where(eq(geoMaps.isActive, true));
  }

  async getGeoMapById(id: number): Promise<GeoMap | undefined> {
    const [map] = await db.select().from(geoMaps).where(eq(geoMaps.id, id));
    return map;
  }

  async getGeoMapByKey(key: string): Promise<GeoMapWithRegions | undefined> {
    const [map] = await db.select().from(geoMaps).where(eq(geoMaps.key, key));
    if (!map) return undefined;
    
    const regions = await db.select().from(geoRegions).where(eq(geoRegions.mapId, map.id));
    return { ...map, regions };
  }

  async createGeoMap(map: InsertGeoMap): Promise<GeoMap> {
    const [newMap] = await db.insert(geoMaps).values(map).returning();
    return newMap;
  }

  async getGeoRegionsByMap(mapId: number): Promise<GeoRegion[]> {
    return db.select().from(geoRegions).where(eq(geoRegions.mapId, mapId));
  }

  async createGeoRegion(region: InsertGeoRegion): Promise<GeoRegion> {
    const [newRegion] = await db.insert(geoRegions).values(region).returning();
    return newRegion;
  }

  async submitGeoGameResult(result: InsertGeoGameResult): Promise<GeoGameResult> {
    // Update user score if they earned points
    if (result.score > 0) {
      await this.updateUserScore(result.userId, result.score);
    }

    const [newResult] = await db.insert(geoGameResults).values(result).returning();
    return newResult;
  }

  async getPlayerGeoHighScores(userId: number, mapId?: number): Promise<GeoGameResult[]> {
    const query = db.select().from(geoGameResults).where(eq(geoGameResults.userId, userId));
    
    if (mapId) {
      query.where(and(eq(geoGameResults.userId, userId), eq(geoGameResults.mapId, mapId)));
    }
    
    return query.orderBy(sql`${geoGameResults.score} DESC`).limit(10);
  }

  async getGeoLeaderboard(mapId: number, limit: number = 10): Promise<GeoGameResult[]> {
    return db
      .select({
        id: geoGameResults.id,
        userId: geoGameResults.userId,
        mapId: geoGameResults.mapId,
        score: geoGameResults.score,
        maxScore: geoGameResults.maxScore,
        correctAnswers: geoGameResults.correctAnswers,
        totalQuestions: geoGameResults.totalQuestions,
        timeSpent: geoGameResults.timeSpent,
        completedAt: geoGameResults.completedAt,
        streakBonus: geoGameResults.streakBonus,
        hintsUsed: geoGameResults.hintsUsed,
        username: users.username
      })
      .from(geoGameResults)
      .leftJoin(users, eq(geoGameResults.userId, users.id))
      .where(eq(geoGameResults.mapId, mapId))
      .orderBy(sql`${geoGameResults.score} DESC`)
      .limit(limit);
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();

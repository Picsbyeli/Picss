import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  tokenExpiry: timestamp("token_expiry"),
  score: integer("score").notNull().default(0),
  solvedCount: integer("solved_count").notNull().default(0),
  avgTimeSeconds: integer("avg_time_seconds").notNull().default(0),
  // Game-specific stats
  burbleCount: integer("burble_count").notNull().default(0),
  valentineCount: integer("valentine_count").notNull().default(0),
  emojiCount: integer("emoji_count").notNull().default(0),
  brainTeaserCount: integer("brain_teaser_count").notNull().default(0),
  triviaCount: integer("trivia_count").notNull().default(0),
  animalTriviaCount: integer("animal_trivia_count").notNull().default(0),
  // Bot battle tracking
  botWins: integer("bot_wins").notNull().default(0),
  botLosses: integer("bot_losses").notNull().default(0),
  botDifficultyLevel: integer("bot_difficulty_level").notNull().default(1), // 1-10 scale
  
  // Avatar customization
  avatarConfig: text("avatar_config").default('{}'), // JSON object storing avatar customization options
  profileImageUrl: text("profile_image_url"), // URL to uploaded profile image
});

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  favorites: many(userFavorites),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isVerified: true,
  verificationToken: true,
  tokenExpiry: true,
  score: true,
  solvedCount: true,
  avgTimeSeconds: true,
  burbleCount: true,
  valentineCount: true,
  emojiCount: true,
  brainTeaserCount: true,
  triviaCount: true,
  animalTriviaCount: true,
  botWins: true,
  botLosses: true,
  botDifficultyLevel: true,
  avatarConfig: true,
  profileImageUrl: true,
});

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  colorClass: text("color_class").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  riddles: many(riddles),
}));

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true, 
  description: true,
  colorClass: true,
});

// Riddles schema
export const riddles = pgTable("riddles", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint"),
  explanation: text("explanation"),
  imageUrl: text("image_url"), // URL to an image for visual riddles
  categoryId: integer("category_id").notNull().references(() => categories.id),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  avgSolveTimeSeconds: integer("avg_solve_time_seconds").default(0),
  creatorName: text("creator_name").default("Anonymous"), // Name of the riddle creator
  isFanMade: boolean("is_fan_made").default(false), // Indicates if it's user-submitted
});

export const riddlesRelations = relations(riddles, ({ one, many }) => ({
  category: one(categories, {
    fields: [riddles.categoryId],
    references: [categories.id],
  }),
  userProgress: many(userProgress),
  userFavorites: many(userFavorites),
}));

export const insertRiddleSchema = createInsertSchema(riddles).pick({
  question: true,
  answer: true,
  hint: true,
  explanation: true,
  imageUrl: true,
  categoryId: true,
  difficulty: true,
  avgSolveTimeSeconds: true,
  creatorName: true,
  isFanMade: true,
});

// User progress schema - tracks which riddles a user has solved
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  solved: boolean("solved").notNull().default(false),
  timeToSolveSeconds: integer("time_to_solve_seconds"),
  hintsUsed: integer("hints_used").default(0),
  solvedAt: timestamp("solved_at"),
  hasViewedAnswer: boolean("has_viewed_answer").notNull().default(false),
});

// User favorites schema - tracks which riddles a user has favorited
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => {
  return {
    userRiddleUnique: primaryKey({ columns: [table.userId, table.riddleId] })
  };
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  riddle: one(riddles, {
    fields: [userProgress.riddleId],
    references: [riddles.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  riddle: one(riddles, {
    fields: [userFavorites.riddleId],
    references: [riddles.id],
  }),
}));

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  riddleId: true,
  solved: true,
  timeToSolveSeconds: true,
  hintsUsed: true,
  hasViewedAnswer: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).pick({
  userId: true,
  riddleId: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Riddle = typeof riddles.$inferSelect;
export type InsertRiddle = z.infer<typeof insertRiddleSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;

// For frontend use - combined riddle with category info
export type RiddleWithCategory = Riddle & { 
  category: { 
    name: string; 
    colorClass: string;
  } 
};

// For favorites display with category info
export type FavoriteWithRiddleAndCategory = UserFavorite & {
  riddle: RiddleWithCategory;
};

// Multiplayer game sessions schema
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull().unique(), // 6-digit code for joining
  hostUserId: integer("host_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("waiting"), // "waiting", "active", "finished"
  maxPlayers: integer("max_players").notNull().default(2),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  riddleIds: text("riddle_ids").notNull(), // JSON array of riddle IDs for this game
  categoryId: integer("category_id").references(() => categories.id),
  difficulty: text("difficulty"), // "easy", "medium", "hard", "mixed"
  timePerQuestion: integer("time_per_question").notNull().default(30), // seconds
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});

// Game participants schema - tracks who's in each game
export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAnswered: integer("total_answered").notNull().default(0),
  isReady: boolean("is_ready").notNull().default(false),
  hp: integer("hp").notNull().default(50), // Health points for battle mode
  maxHp: integer("max_hp").notNull().default(50), // Maximum health points based on sprite
  hasShield: boolean("has_shield").notNull().default(false), // Shield protection status
  chargePower: integer("charge_power").notNull().default(0), // Extra damage for next attack
  lastAction: text("last_action"), // "attack", "shield", "charge"
  spriteType: text("sprite_type").notNull().default("balanced"), // "big_brain", "risk_taker", "tank", "balanced"
  energy: integer("energy").notNull().default(0), // Energy points for abilities
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
}, (table) => {
  return {
    sessionUserUnique: primaryKey({ columns: [table.sessionId, table.userId] })
  };
});

// Game answers schema - tracks each player's answer to each question
export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  questionIndex: integer("question_index").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswerSeconds: integer("time_to_answer_seconds").notNull(),
  battleAction: text("battle_action"), // "attack", "shield", "charge" - chosen after correct answer
  damageDealt: integer("damage_dealt").notNull().default(0), // Actual damage dealt in battle
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Relations for multiplayer tables
export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [gameSessions.hostUserId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [gameSessions.categoryId],
    references: [categories.id],
  }),
  participants: many(gameParticipants),
  answers: many(gameAnswers),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameParticipants.sessionId],
    references: [gameSessions.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id],
  }),
}));

export const gameAnswersRelations = relations(gameAnswers, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameAnswers.sessionId],
    references: [gameSessions.id],
  }),
  user: one(users, {
    fields: [gameAnswers.userId],
    references: [users.id],
  }),
  riddle: one(riddles, {
    fields: [gameAnswers.riddleId],
    references: [riddles.id],
  }),
}));

// Insert schemas for multiplayer
export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  sessionCode: true,
  hostUserId: true,
  status: true,
  maxPlayers: true,
  currentQuestionIndex: true,
  riddleIds: true,
  categoryId: true,
  difficulty: true,
  timePerQuestion: true,
  startedAt: true,
  finishedAt: true,
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).pick({
  sessionId: true,
  userId: true,
  score: true,
  correctAnswers: true,
  totalAnswered: true,
  isReady: true,
  leftAt: true,
});

export const insertGameAnswerSchema = createInsertSchema(gameAnswers).pick({
  sessionId: true,
  userId: true,
  riddleId: true,
  questionIndex: true,
  answer: true,
  isCorrect: true,
  timeToAnswerSeconds: true,
});

// Multiplayer types
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type GameParticipant = typeof gameParticipants.$inferSelect;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;

export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;

// Sprite type definitions
export type SpriteType = "big_brain" | "risk_taker" | "tank" | "balanced";

export interface SpriteInfo {
  id: SpriteType;
  name: string;
  description: string;
  startingHp: number;
  startingEnergy: number;
  correctBonus: number;
  incorrectPenalty: number;
  emoji: string;
}

// Combined types for frontend
export type GameSessionWithParticipants = GameSession & {
  participants: (GameParticipant & { user: User })[];
  category?: Category;
};

export type GameLeaderboard = {
  userId: number;
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  position: number;
};


// Quiz topics schema for solo dungeon categories
export const quizTopics = pgTable("quiz_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Math", "History", "Animal Facts", etc.
  description: text("description"),
  isCustom: boolean("is_custom").notNull().default(false), // User-created vs preset
  createdBy: integer("created_by").references(() => users.id), // User who created custom topic
  keywords: text("keywords"), // Comma-separated keywords for AI generation
  colorTheme: text("color_theme").notNull().default("blue"), // For battle arena theming
  iconEmoji: text("icon_emoji").notNull().default("🧠"), // Visual representation
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz questions schema for solo dungeon combat
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => quizTopics.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // "multiple_choice", "true_false", "text_input"
  choices: text("choices"), // JSON array for multiple choice ["A", "B", "C", "D"]
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"), // Why this answer is correct
  difficulty: text("difficulty").notNull().default("medium"), // "easy", "medium", "hard"
  energyReward: integer("energy_reward").notNull().default(15), // Energy gained for correct answer
  source: text("source").notNull().default("generated"), // "curated", "generated", "user_submitted"
  createdBy: integer("created_by").references(() => users.id), // Optional user who created
  createdAt: timestamp("created_at").defaultNow(),
});

// Dungeon runs schema for persisting solo dungeon state
export const dungeonRuns = pgTable("dungeon_runs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id), // Null for guest players
  activeBurblemonId: integer("active_burblemon_id").references(() => playerBurblemons.id), // Burblemon fighting in this dungeon
  characterType: text("character_type").notNull(), // "psychic_sage", "shadow_striker", etc.
  topicId: integer("topic_id").notNull().references(() => quizTopics.id),
  playerHp: integer("player_hp").notNull().default(60),
  playerMaxHp: integer("player_max_hp").notNull().default(60),
  playerEnergy: integer("player_energy").notNull().default(80),
  enemyHp: integer("enemy_hp").notNull().default(35),
  enemyMaxHp: integer("enemy_max_hp").notNull().default(35),
  currentEnemyType: text("current_enemy_type").notNull().default("grunt"), // "grunt", "boss"
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  enemiesDefeated: integer("enemies_defeated").notNull().default(0), // Track total enemies beaten
  isActive: boolean("is_active").notNull().default(true),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations for quiz tables
export const quizTopicsRelations = relations(quizTopics, ({ one, many }) => ({
  creator: one(users, {
    fields: [quizTopics.createdBy],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  dungeonRuns: many(dungeonRuns),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  topic: one(quizTopics, {
    fields: [quizQuestions.topicId],
    references: [quizTopics.id],
  }),
  creator: one(users, {
    fields: [quizQuestions.createdBy],
    references: [users.id],
  }),
}));

export const dungeonRunsRelations = relations(dungeonRuns, ({ one }) => ({
  player: one(users, {
    fields: [dungeonRuns.playerId],
    references: [users.id],
  }),
  topic: one(quizTopics, {
    fields: [dungeonRuns.topicId],
    references: [quizTopics.id],
  }),
  activeBurblemon: one(playerBurblemons, {
    fields: [dungeonRuns.activeBurblemonId],
    references: [playerBurblemons.id],
  }),
}));

// Insert schemas for quiz tables
export const insertQuizTopicSchema = createInsertSchema(quizTopics).pick({
  name: true,
  description: true,
  isCustom: true,
  createdBy: true,
  keywords: true,
  colorTheme: true,
  iconEmoji: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  topicId: true,
  questionText: true,
  questionType: true,
  choices: true,
  correctAnswer: true,
  explanation: true,
  difficulty: true,
  energyReward: true,
  source: true,
  createdBy: true,
});

export const insertDungeonRunSchema = createInsertSchema(dungeonRuns).pick({
  playerId: true,
  activeBurblemonId: true,
  characterType: true,
  topicId: true,
  playerHp: true,
  playerMaxHp: true,
  playerEnergy: true,
  enemyHp: true,
  enemyMaxHp: true,
  currentEnemyType: true,
  questionsAnswered: true,
  correctAnswers: true,
  enemiesDefeated: true,
  isActive: true,
  completedAt: true,
});

// Burblemon Species - Base creature types
export const burblemonSpecies = pgTable("burblemon_species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Sparkbubble", "Flamepaw", etc.
  category: text("category"), // Species category
  element_type: text("element_type").notNull(), // "Electric", "Fire", "Water", "Grass", etc.
  base_hp: integer("base_hp").notNull().default(50),
  base_attack: integer("base_attack").notNull().default(50),
  base_defense: integer("base_defense").notNull().default(50),
  base_speed: integer("base_speed").notNull().default(50),
  evolution_level: integer("evolution_level"),
  evolved_form_id: integer("evolved_form_id"),
  rarity: text("rarity").notNull().default("common"),
  habitat: text("habitat"),
  personality_traits: text("personality_traits").array(),
  catch_rate: real("catch_rate"),
  sprite_url: text("sprite_url"), // Visual sprite/emoji for battle system
  description: text("description"),
});

// Burblemon Evolution Forms - Different evolution stages
export const burblemonForms = pgTable("burblemon_forms", {
  id: serial("id").primaryKey(),
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  formName: text("form_name").notNull(), // "Baby", "Juvenile", "Adult", "Elder"
  evolutionLevel: integer("evolution_level").notNull().default(1), // Level required to evolve to this form
  hpMultiplier: real("hp_multiplier").notNull().default(1.0), // Stat multipliers for this form
  attackMultiplier: real("attack_multiplier").notNull().default(1.0),
  defenseMultiplier: real("defense_multiplier").notNull().default(1.0),
  speedMultiplier: real("speed_multiplier").notNull().default(1.0),
  iconEmoji: text("icon_emoji").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player-owned Burblemons
export const playerBurblemons = pgTable("player_burblemons", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id), // Null for guest players
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  nickname: text("nickname"), // Custom name given by player
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  speed: integer("speed").notNull(),
  happiness: integer("happiness").notNull().default(50), // Affects evolution and performance
  isStarter: boolean("is_starter").notNull().default(false), // First Burblemon
  caughtAt: timestamp("caught_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
});

// Map Zones - Areas to explore
export const mapZones = pgTable("map_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Tutorial Town", "Mystic Forest", "Crystal Cave"
  description: text("description"),
  requiredLevel: integer("required_level").notNull().default(1), // Min level to enter
  isTutorial: boolean("is_tutorial").notNull().default(false),
  colorTheme: text("color_theme").notNull().default("green"),
  iconEmoji: text("icon_emoji").notNull().default("🌲"),
  backgroundImage: text("background_image"), // Optional background asset
  createdAt: timestamp("created_at").defaultNow(),
});

// Zone Connections - How zones connect to each other
export const zonePaths = pgTable("zone_paths", {
  id: serial("id").primaryKey(),
  fromZoneId: integer("from_zone_id").notNull().references(() => mapZones.id),
  toZoneId: integer("to_zone_id").notNull().references(() => mapZones.id),
  requiresBossDefeat: boolean("requires_boss_defeat").notNull().default(true), // Must beat boss to unlock
  createdAt: timestamp("created_at").defaultNow(),
});

// Player Map Progress
export const playerMapProgress = pgTable("player_map_progress", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  currentZoneId: integer("current_zone_id").notNull().references(() => mapZones.id),
  unlockedZones: text("unlocked_zones").notNull().default("[]"), // JSON array of zone IDs
  defeatedBosses: text("defeated_bosses").notNull().default("[]"), // JSON array of boss IDs
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),
  lastPosition: timestamp("last_position").defaultNow(),
});

// Wild Encounters - What Burblemons can be found where
export const wildEncounters = pgTable("wild_encounters", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => mapZones.id),
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  encounterRate: real("encounter_rate").notNull().default(0.1), // 0.0 to 1.0
  minLevel: integer("min_level").notNull().default(1),
  maxLevel: integer("max_level").notNull().default(5),
  isTrainerEncounter: boolean("is_trainer_encounter").notNull().default(false), // NPC trainer vs wild
  trainerName: text("trainer_name"), // Name if it's a trainer encounter
  createdAt: timestamp("created_at").defaultNow(),
});

// Items - Healing, capture, and utility items
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Burble Ball", "Healing Potion", "Repel"
  description: text("description"),
  type: text("type").notNull(), // "capture", "healing", "utility"
  effect: text("effect").notNull(), // JSON object describing item effects
  basePrice: integer("base_price").notNull().default(100), // Cost in shop
  iconEmoji: text("icon_emoji").notNull().default("⚡"),
  isConsumable: boolean("is_consumable").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player Inventory
export const playerInventory = pgTable("player_inventory", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Player Economy
export const playerEconomy = pgTable("player_economy", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  money: integer("money").notNull().default(500), // Starting money
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  lastTransaction: timestamp("last_transaction").defaultNow(),
});

// Battle Records
export const battleRecords = pgTable("battle_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  playerBurblemonId: integer("player_burblemon_id").notNull().references(() => playerBurblemons.id),
  opponentType: text("opponent_type").notNull(), // "wild", "trainer", "boss"
  opponentId: integer("opponent_id"), // Species ID for wild, encounter ID for trainers
  battleResult: text("battle_result").notNull(), // "victory", "defeat", "capture", "flee"
  xpGained: integer("xp_gained").notNull().default(0),
  moneyGained: integer("money_gained").notNull().default(0),
  itemsUsed: text("items_used").default("[]"), // JSON array of item IDs used
  battleDuration: integer("battle_duration"), // Seconds
  battleDate: timestamp("battle_date").defaultNow(),
});

// Burblemon insert schemas (after table definitions)
export const insertBurblemonSpeciesSchema = createInsertSchema(burblemonSpecies).pick({
  name: true,
  category: true,
  element_type: true,
  base_hp: true,
  base_attack: true,
  base_defense: true,
  base_speed: true,
  evolution_level: true,
  evolved_form_id: true,
  rarity: true,
  habitat: true,
  personality_traits: true,
  catch_rate: true,
  sprite_url: true,
  description: true,
});

export const insertBurblemonFormSchema = createInsertSchema(burblemonForms).pick({
  speciesId: true,
  formName: true,
  evolutionLevel: true,
  hpMultiplier: true,
  attackMultiplier: true,
  defenseMultiplier: true,
  speedMultiplier: true,
  iconEmoji: true,
  description: true,
});

export const insertPlayerBurblemonSchema = createInsertSchema(playerBurblemons).pick({
  playerId: true,
  speciesId: true,
  nickname: true,
  level: true,
  xp: true,
  currentHp: true,
  maxHp: true,
  attack: true,
  defense: true,
  speed: true,
  happiness: true,
  isStarter: true,
});

export const insertMapZoneSchema = createInsertSchema(mapZones).pick({
  name: true,
  description: true,
  requiredLevel: true,
  isTutorial: true,
  colorTheme: true,
  iconEmoji: true,
  backgroundImage: true,
});

export const insertZonePathSchema = createInsertSchema(zonePaths).pick({
  fromZoneId: true,
  toZoneId: true,
  requiresBossDefeat: true,
});

export const insertPlayerMapProgressSchema = createInsertSchema(playerMapProgress).pick({
  playerId: true,
  currentZoneId: true,
  unlockedZones: true,
  defeatedBosses: true,
  tutorialCompleted: true,
});

export const insertWildEncounterSchema = createInsertSchema(wildEncounters).pick({
  zoneId: true,
  speciesId: true,
  encounterRate: true,
  minLevel: true,
  maxLevel: true,
  isTrainerEncounter: true,
  trainerName: true,
});

export const insertItemSchema = createInsertSchema(items).pick({
  name: true,
  description: true,
  type: true,
  effect: true,
  basePrice: true,
  iconEmoji: true,
  isConsumable: true,
});

export const insertPlayerInventorySchema = createInsertSchema(playerInventory).pick({
  playerId: true,
  itemId: true,
  quantity: true,
});

export const insertPlayerEconomySchema = createInsertSchema(playerEconomy).pick({
  playerId: true,
  money: true,
  totalEarned: true,
  totalSpent: true,
});

export const insertBattleRecordSchema = createInsertSchema(battleRecords).pick({
  playerId: true,
  playerBurblemonId: true,
  opponentType: true,
  opponentId: true,
  battleResult: true,
  xpGained: true,
  moneyGained: true,
  itemsUsed: true,
  battleDuration: true,
});

// Quiz types
export type QuizTopic = typeof quizTopics.$inferSelect;
export type InsertQuizTopic = z.infer<typeof insertQuizTopicSchema>;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type DungeonRun = typeof dungeonRuns.$inferSelect;
export type InsertDungeonRun = z.infer<typeof insertDungeonRunSchema>;

// Burblemon insert types
export type InsertBurblemonSpecies = z.infer<typeof insertBurblemonSpeciesSchema>;
export type InsertBurblemonForm = z.infer<typeof insertBurblemonFormSchema>;
export type InsertPlayerBurblemon = z.infer<typeof insertPlayerBurblemonSchema>;
export type InsertMapZone = z.infer<typeof insertMapZoneSchema>;
export type InsertZonePath = z.infer<typeof insertZonePathSchema>;
export type InsertPlayerMapProgress = z.infer<typeof insertPlayerMapProgressSchema>;
export type InsertWildEncounter = z.infer<typeof insertWildEncounterSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertPlayerInventory = z.infer<typeof insertPlayerInventorySchema>;
export type InsertPlayerEconomy = z.infer<typeof insertPlayerEconomySchema>;
export type InsertBattleRecord = z.infer<typeof insertBattleRecordSchema>;

// Burblemon types
export type BurblemonSpecies = typeof burblemonSpecies.$inferSelect;
export type BurblemonForm = typeof burblemonForms.$inferSelect;
export type PlayerBurblemon = typeof playerBurblemons.$inferSelect;
export type MapZone = typeof mapZones.$inferSelect;
export type ZonePath = typeof zonePaths.$inferSelect;
export type PlayerMapProgress = typeof playerMapProgress.$inferSelect;
export type WildEncounter = typeof wildEncounters.$inferSelect;
export type Item = typeof items.$inferSelect;
export type PlayerInventory = typeof playerInventory.$inferSelect;
export type PlayerEconomy = typeof playerEconomy.$inferSelect;
export type BattleRecord = typeof battleRecords.$inferSelect;

// Combined types for frontend
export type QuizTopicWithQuestions = QuizTopic & {
  questions: QuizQuestion[];
};

export type DungeonRunWithTopic = DungeonRun & {
  topic: QuizTopic;
};

export type PlayerBurblemonWithSpecies = PlayerBurblemon & {
  species: BurblemonSpecies;
  currentForm?: BurblemonForm;
};

export type ZoneWithConnections = MapZone & {
  connections: ZonePath[];
  encounters: WildEncounter[];
};

// Geography Game System - Interactive Maps
export const geoMaps = pgTable("geo_maps", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // "us_states", "asia_countries", etc.
  name: text("name").notNull(), // "United States", "Asia", etc.
  description: text("description"),
  totalRegions: integer("total_regions").notNull(), // 50 for US states, varies for continents
  mapType: text("map_type").notNull(), // "countries", "states", "provinces"
  difficulty: text("difficulty").notNull().default("medium"), // "easy", "medium", "hard"
  rewardMultiplier: real("reward_multiplier").notNull().default(1.0),
  svgViewBox: text("svg_viewbox"), // SVG viewBox for proper scaling
  isActive: boolean("is_active").notNull().default(true),
});

export const geoRegions = pgTable("geo_regions", {
  id: serial("id").primaryKey(),
  mapId: integer("map_id").notNull().references(() => geoMaps.id),
  code: text("code").notNull(), // "CA", "TX", "CN", "JP" - short codes
  name: text("name").notNull(), // "California", "Texas", "China", "Japan"
  fullName: text("full_name"), // "State of California", "People's Republic of China"
  capital: text("capital"), // Capital city if applicable
  svgPath: text("svg_path").notNull(), // SVG path data for the region shape
  centroidX: real("centroid_x"), // X coordinate for label positioning
  centroidY: real("centroid_y"), // Y coordinate for label positioning
  difficulty: text("difficulty").default("medium"),
  hints: text("hints").array(), // Array of hint strings
});

export const geoGameResults = pgTable("geo_game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mapId: integer("map_id").notNull().references(() => geoMaps.id),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
  streakBonus: integer("streak_bonus").default(0),
  hintsUsed: integer("hints_used").default(0),
});

// Geography relations
export const geoMapsRelations = relations(geoMaps, ({ many }) => ({
  regions: many(geoRegions),
  results: many(geoGameResults),
}));

export const geoRegionsRelations = relations(geoRegions, ({ one }) => ({
  map: one(geoMaps, {
    fields: [geoRegions.mapId],
    references: [geoMaps.id],
  }),
}));

export const geoGameResultsRelations = relations(geoGameResults, ({ one }) => ({
  user: one(users, {
    fields: [geoGameResults.userId],
    references: [users.id],
  }),
  map: one(geoMaps, {
    fields: [geoGameResults.mapId],
    references: [geoMaps.id],
  }),
}));

// Geography insert schemas
export const insertGeoMapSchema = createInsertSchema(geoMaps).pick({
  key: true,
  name: true,
  description: true,
  totalRegions: true,
  mapType: true,
  difficulty: true,
  rewardMultiplier: true,
  svgViewBox: true,
  isActive: true,
});

export const insertGeoRegionSchema = createInsertSchema(geoRegions).pick({
  mapId: true,
  code: true,
  name: true,
  fullName: true,
  capital: true,
  svgPath: true,
  centroidX: true,
  centroidY: true,
  difficulty: true,
  hints: true,
});

export const insertGeoGameResultSchema = createInsertSchema(geoGameResults).pick({
  userId: true,
  mapId: true,
  score: true,
  maxScore: true,
  correctAnswers: true,
  totalQuestions: true,
  timeSpent: true,
  streakBonus: true,
  hintsUsed: true,
});

// Geography types
export type GeoMap = typeof geoMaps.$inferSelect;
export type GeoRegion = typeof geoRegions.$inferSelect;
export type GeoGameResult = typeof geoGameResults.$inferSelect;

export type InsertGeoMap = z.infer<typeof insertGeoMapSchema>;
export type InsertGeoRegion = z.infer<typeof insertGeoRegionSchema>;
export type InsertGeoGameResult = z.infer<typeof insertGeoGameResultSchema>;

export type GeoMapWithRegions = GeoMap & {
  regions: GeoRegion[];
};

export type GeoGameSession = {
  mapId: number;
  userId: number;
  answers: Record<string, string>; // regionCode -> userAnswer
  startTime: Date;
  hintsUsed: string[]; // regionCodes where hints were used
};

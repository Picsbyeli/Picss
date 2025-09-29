var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/objectStorage.ts
var objectStorage_exports = {};
__export(objectStorage_exports, {
  ObjectNotFoundError: () => ObjectNotFoundError,
  ObjectStorageService: () => ObjectStorageService,
  objectStorageClient: () => objectStorageClient
});
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    objectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      // Gets the public object search paths.
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      // Gets the private object directory.
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return dir;
      }
      // Search for a public object from the search paths.
      async searchPublicObject(filePath) {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      // Downloads an object to the response.
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": metadata.size,
            "Cache-Control": `public, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      // Gets the upload URL for a profile image.
      async getProfileImageUploadURL() {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const objectId = randomUUID();
        const fullPath = `${privateObjectDir}/profile-images/${objectId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the profile image file from the object path.
      async getProfileImageFile(objectPath) {
        if (!objectPath.startsWith("/profile-images/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const imageId = parts.slice(1).join("/");
        let imageDir = this.getPrivateObjectDir();
        if (!imageDir.endsWith("/")) {
          imageDir = `${imageDir}/`;
        }
        const objectImagePath = `${imageDir}profile-images/${imageId}`;
        const { bucketName, objectName } = parseObjectPath(objectImagePath);
        const bucket = objectStorageClient.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeProfileImagePath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let profileImageDir = this.getPrivateObjectDir();
        if (!profileImageDir.endsWith("/")) {
          profileImageDir = `${profileImageDir}/`;
        }
        if (!rawObjectPath.startsWith(profileImageDir)) {
          return rawObjectPath;
        }
        const imageId = rawObjectPath.slice(profileImageDir.length);
        return `/${imageId}`;
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  battleRecords: () => battleRecords,
  burblemonForms: () => burblemonForms,
  burblemonSpecies: () => burblemonSpecies,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  dungeonRuns: () => dungeonRuns,
  dungeonRunsRelations: () => dungeonRunsRelations,
  gameAnswers: () => gameAnswers,
  gameAnswersRelations: () => gameAnswersRelations,
  gameParticipants: () => gameParticipants,
  gameParticipantsRelations: () => gameParticipantsRelations,
  gameSessions: () => gameSessions,
  gameSessionsRelations: () => gameSessionsRelations,
  geoGameResults: () => geoGameResults,
  geoGameResultsRelations: () => geoGameResultsRelations,
  geoMaps: () => geoMaps,
  geoMapsRelations: () => geoMapsRelations,
  geoRegions: () => geoRegions,
  geoRegionsRelations: () => geoRegionsRelations,
  insertBattleRecordSchema: () => insertBattleRecordSchema,
  insertBurblemonFormSchema: () => insertBurblemonFormSchema,
  insertBurblemonSpeciesSchema: () => insertBurblemonSpeciesSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertDungeonRunSchema: () => insertDungeonRunSchema,
  insertGameAnswerSchema: () => insertGameAnswerSchema,
  insertGameParticipantSchema: () => insertGameParticipantSchema,
  insertGameSessionSchema: () => insertGameSessionSchema,
  insertGeoGameResultSchema: () => insertGeoGameResultSchema,
  insertGeoMapSchema: () => insertGeoMapSchema,
  insertGeoRegionSchema: () => insertGeoRegionSchema,
  insertItemSchema: () => insertItemSchema,
  insertMapZoneSchema: () => insertMapZoneSchema,
  insertPlayerBurblemonSchema: () => insertPlayerBurblemonSchema,
  insertPlayerEconomySchema: () => insertPlayerEconomySchema,
  insertPlayerInventorySchema: () => insertPlayerInventorySchema,
  insertPlayerMapProgressSchema: () => insertPlayerMapProgressSchema,
  insertQuizQuestionSchema: () => insertQuizQuestionSchema,
  insertQuizTopicSchema: () => insertQuizTopicSchema,
  insertRiddleSchema: () => insertRiddleSchema,
  insertUserFavoriteSchema: () => insertUserFavoriteSchema,
  insertUserProgressSchema: () => insertUserProgressSchema,
  insertUserSchema: () => insertUserSchema,
  insertWildEncounterSchema: () => insertWildEncounterSchema,
  insertZonePathSchema: () => insertZonePathSchema,
  items: () => items,
  mapZones: () => mapZones,
  playerBurblemons: () => playerBurblemons,
  playerEconomy: () => playerEconomy,
  playerInventory: () => playerInventory,
  playerMapProgress: () => playerMapProgress,
  quizQuestions: () => quizQuestions,
  quizQuestionsRelations: () => quizQuestionsRelations,
  quizTopics: () => quizTopics,
  quizTopicsRelations: () => quizTopicsRelations,
  riddles: () => riddles,
  riddlesRelations: () => riddlesRelations,
  userFavorites: () => userFavorites,
  userFavoritesRelations: () => userFavoritesRelations,
  userProgress: () => userProgress,
  userProgressRelations: () => userProgressRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  wildEncounters: () => wildEncounters,
  zonePaths: () => zonePaths
});
import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
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
  botDifficultyLevel: integer("bot_difficulty_level").notNull().default(1),
  // 1-10 scale
  // Avatar customization
  avatarConfig: text("avatar_config").default("{}"),
  // JSON object storing avatar customization options
  profileImageUrl: text("profile_image_url")
  // URL to uploaded profile image
});
var usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  favorites: many(userFavorites)
}));
var insertUserSchema = createInsertSchema(users).pick({
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
  profileImageUrl: true
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  colorClass: text("color_class").notNull()
});
var categoriesRelations = relations(categories, ({ many }) => ({
  riddles: many(riddles)
}));
var insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  colorClass: true
});
var riddles = pgTable("riddles", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint"),
  explanation: text("explanation"),
  imageUrl: text("image_url"),
  // URL to an image for visual riddles
  categoryId: integer("category_id").notNull().references(() => categories.id),
  difficulty: text("difficulty").notNull(),
  // "easy", "medium", "hard"
  avgSolveTimeSeconds: integer("avg_solve_time_seconds").default(0),
  creatorName: text("creator_name").default("Anonymous"),
  // Name of the riddle creator
  isFanMade: boolean("is_fan_made").default(false)
  // Indicates if it's user-submitted
});
var riddlesRelations = relations(riddles, ({ one, many }) => ({
  category: one(categories, {
    fields: [riddles.categoryId],
    references: [categories.id]
  }),
  userProgress: many(userProgress),
  userFavorites: many(userFavorites)
}));
var insertRiddleSchema = createInsertSchema(riddles).pick({
  question: true,
  answer: true,
  hint: true,
  explanation: true,
  imageUrl: true,
  categoryId: true,
  difficulty: true,
  avgSolveTimeSeconds: true,
  creatorName: true,
  isFanMade: true
});
var userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  solved: boolean("solved").notNull().default(false),
  timeToSolveSeconds: integer("time_to_solve_seconds"),
  hintsUsed: integer("hints_used").default(0),
  solvedAt: timestamp("solved_at"),
  hasViewedAnswer: boolean("has_viewed_answer").notNull().default(false)
});
var userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  addedAt: timestamp("added_at").defaultNow()
}, (table) => {
  return {
    userRiddleUnique: primaryKey({ columns: [table.userId, table.riddleId] })
  };
});
var userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  }),
  riddle: one(riddles, {
    fields: [userProgress.riddleId],
    references: [riddles.id]
  })
}));
var userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id]
  }),
  riddle: one(riddles, {
    fields: [userFavorites.riddleId],
    references: [riddles.id]
  })
}));
var insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  riddleId: true,
  solved: true,
  timeToSolveSeconds: true,
  hintsUsed: true,
  hasViewedAnswer: true
});
var insertUserFavoriteSchema = createInsertSchema(userFavorites).pick({
  userId: true,
  riddleId: true
});
var gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  // 6-digit code for joining
  hostUserId: integer("host_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("waiting"),
  // "waiting", "active", "finished"
  maxPlayers: integer("max_players").notNull().default(2),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  riddleIds: text("riddle_ids").notNull(),
  // JSON array of riddle IDs for this game
  categoryId: integer("category_id").references(() => categories.id),
  difficulty: text("difficulty"),
  // "easy", "medium", "hard", "mixed"
  timePerQuestion: integer("time_per_question").notNull().default(30),
  // seconds
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at")
});
var gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAnswered: integer("total_answered").notNull().default(0),
  isReady: boolean("is_ready").notNull().default(false),
  hp: integer("hp").notNull().default(50),
  // Health points for battle mode
  maxHp: integer("max_hp").notNull().default(50),
  // Maximum health points based on sprite
  hasShield: boolean("has_shield").notNull().default(false),
  // Shield protection status
  chargePower: integer("charge_power").notNull().default(0),
  // Extra damage for next attack
  lastAction: text("last_action"),
  // "attack", "shield", "charge"
  spriteType: text("sprite_type").notNull().default("balanced"),
  // "big_brain", "risk_taker", "tank", "balanced"
  energy: integer("energy").notNull().default(0),
  // Energy points for abilities
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at")
}, (table) => {
  return {
    sessionUserUnique: primaryKey({ columns: [table.sessionId, table.userId] })
  };
});
var gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => gameSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  riddleId: integer("riddle_id").notNull().references(() => riddles.id),
  questionIndex: integer("question_index").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswerSeconds: integer("time_to_answer_seconds").notNull(),
  battleAction: text("battle_action"),
  // "attack", "shield", "charge" - chosen after correct answer
  damageDealt: integer("damage_dealt").notNull().default(0),
  // Actual damage dealt in battle
  answeredAt: timestamp("answered_at").defaultNow()
});
var gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  host: one(users, {
    fields: [gameSessions.hostUserId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [gameSessions.categoryId],
    references: [categories.id]
  }),
  participants: many(gameParticipants),
  answers: many(gameAnswers)
}));
var gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameParticipants.sessionId],
    references: [gameSessions.id]
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id]
  })
}));
var gameAnswersRelations = relations(gameAnswers, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gameAnswers.sessionId],
    references: [gameSessions.id]
  }),
  user: one(users, {
    fields: [gameAnswers.userId],
    references: [users.id]
  }),
  riddle: one(riddles, {
    fields: [gameAnswers.riddleId],
    references: [riddles.id]
  })
}));
var insertGameSessionSchema = createInsertSchema(gameSessions).pick({
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
  finishedAt: true
});
var insertGameParticipantSchema = createInsertSchema(gameParticipants).pick({
  sessionId: true,
  userId: true,
  score: true,
  correctAnswers: true,
  totalAnswered: true,
  isReady: true,
  leftAt: true
});
var insertGameAnswerSchema = createInsertSchema(gameAnswers).pick({
  sessionId: true,
  userId: true,
  riddleId: true,
  questionIndex: true,
  answer: true,
  isCorrect: true,
  timeToAnswerSeconds: true
});
var quizTopics = pgTable("quiz_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // "Math", "History", "Animal Facts", etc.
  description: text("description"),
  isCustom: boolean("is_custom").notNull().default(false),
  // User-created vs preset
  createdBy: integer("created_by").references(() => users.id),
  // User who created custom topic
  keywords: text("keywords"),
  // Comma-separated keywords for AI generation
  colorTheme: text("color_theme").notNull().default("blue"),
  // For battle arena theming
  iconEmoji: text("icon_emoji").notNull().default("\u{1F9E0}"),
  // Visual representation
  createdAt: timestamp("created_at").defaultNow()
});
var quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => quizTopics.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  // "multiple_choice", "true_false", "text_input"
  choices: text("choices"),
  // JSON array for multiple choice ["A", "B", "C", "D"]
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  // Why this answer is correct
  difficulty: text("difficulty").notNull().default("medium"),
  // "easy", "medium", "hard"
  energyReward: integer("energy_reward").notNull().default(15),
  // Energy gained for correct answer
  source: text("source").notNull().default("generated"),
  // "curated", "generated", "user_submitted"
  createdBy: integer("created_by").references(() => users.id),
  // Optional user who created
  createdAt: timestamp("created_at").defaultNow()
});
var dungeonRuns = pgTable("dungeon_runs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  // Null for guest players
  activeBurblemonId: integer("active_burblemon_id").references(() => playerBurblemons.id),
  // Burblemon fighting in this dungeon
  characterType: text("character_type").notNull(),
  // "psychic_sage", "shadow_striker", etc.
  topicId: integer("topic_id").notNull().references(() => quizTopics.id),
  playerHp: integer("player_hp").notNull().default(60),
  playerMaxHp: integer("player_max_hp").notNull().default(60),
  playerEnergy: integer("player_energy").notNull().default(80),
  enemyHp: integer("enemy_hp").notNull().default(35),
  enemyMaxHp: integer("enemy_max_hp").notNull().default(35),
  currentEnemyType: text("current_enemy_type").notNull().default("grunt"),
  // "grunt", "boss"
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  enemiesDefeated: integer("enemies_defeated").notNull().default(0),
  // Track total enemies beaten
  isActive: boolean("is_active").notNull().default(true),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var quizTopicsRelations = relations(quizTopics, ({ one, many }) => ({
  creator: one(users, {
    fields: [quizTopics.createdBy],
    references: [users.id]
  }),
  questions: many(quizQuestions),
  dungeonRuns: many(dungeonRuns)
}));
var quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  topic: one(quizTopics, {
    fields: [quizQuestions.topicId],
    references: [quizTopics.id]
  }),
  creator: one(users, {
    fields: [quizQuestions.createdBy],
    references: [users.id]
  })
}));
var dungeonRunsRelations = relations(dungeonRuns, ({ one }) => ({
  player: one(users, {
    fields: [dungeonRuns.playerId],
    references: [users.id]
  }),
  topic: one(quizTopics, {
    fields: [dungeonRuns.topicId],
    references: [quizTopics.id]
  }),
  activeBurblemon: one(playerBurblemons, {
    fields: [dungeonRuns.activeBurblemonId],
    references: [playerBurblemons.id]
  })
}));
var insertQuizTopicSchema = createInsertSchema(quizTopics).pick({
  name: true,
  description: true,
  isCustom: true,
  createdBy: true,
  keywords: true,
  colorTheme: true,
  iconEmoji: true
});
var insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  topicId: true,
  questionText: true,
  questionType: true,
  choices: true,
  correctAnswer: true,
  explanation: true,
  difficulty: true,
  energyReward: true,
  source: true,
  createdBy: true
});
var insertDungeonRunSchema = createInsertSchema(dungeonRuns).pick({
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
  completedAt: true
});
var burblemonSpecies = pgTable("burblemon_species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // "Sparkbubble", "Flamepaw", etc.
  category: text("category"),
  // Species category
  element_type: text("element_type").notNull(),
  // "Electric", "Fire", "Water", "Grass", etc.
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
  sprite_url: text("sprite_url"),
  // Visual sprite/emoji for battle system
  description: text("description")
});
var burblemonForms = pgTable("burblemon_forms", {
  id: serial("id").primaryKey(),
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  formName: text("form_name").notNull(),
  // "Baby", "Juvenile", "Adult", "Elder"
  evolutionLevel: integer("evolution_level").notNull().default(1),
  // Level required to evolve to this form
  hpMultiplier: real("hp_multiplier").notNull().default(1),
  // Stat multipliers for this form
  attackMultiplier: real("attack_multiplier").notNull().default(1),
  defenseMultiplier: real("defense_multiplier").notNull().default(1),
  speedMultiplier: real("speed_multiplier").notNull().default(1),
  iconEmoji: text("icon_emoji").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var playerBurblemons = pgTable("player_burblemons", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  // Null for guest players
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  nickname: text("nickname"),
  // Custom name given by player
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  speed: integer("speed").notNull(),
  happiness: integer("happiness").notNull().default(50),
  // Affects evolution and performance
  isStarter: boolean("is_starter").notNull().default(false),
  // First Burblemon
  caughtAt: timestamp("caught_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow()
});
var mapZones = pgTable("map_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // "Tutorial Town", "Mystic Forest", "Crystal Cave"
  description: text("description"),
  requiredLevel: integer("required_level").notNull().default(1),
  // Min level to enter
  isTutorial: boolean("is_tutorial").notNull().default(false),
  colorTheme: text("color_theme").notNull().default("green"),
  iconEmoji: text("icon_emoji").notNull().default("\u{1F332}"),
  backgroundImage: text("background_image"),
  // Optional background asset
  createdAt: timestamp("created_at").defaultNow()
});
var zonePaths = pgTable("zone_paths", {
  id: serial("id").primaryKey(),
  fromZoneId: integer("from_zone_id").notNull().references(() => mapZones.id),
  toZoneId: integer("to_zone_id").notNull().references(() => mapZones.id),
  requiresBossDefeat: boolean("requires_boss_defeat").notNull().default(true),
  // Must beat boss to unlock
  createdAt: timestamp("created_at").defaultNow()
});
var playerMapProgress = pgTable("player_map_progress", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  currentZoneId: integer("current_zone_id").notNull().references(() => mapZones.id),
  unlockedZones: text("unlocked_zones").notNull().default("[]"),
  // JSON array of zone IDs
  defeatedBosses: text("defeated_bosses").notNull().default("[]"),
  // JSON array of boss IDs
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),
  lastPosition: timestamp("last_position").defaultNow()
});
var wildEncounters = pgTable("wild_encounters", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => mapZones.id),
  speciesId: integer("species_id").notNull().references(() => burblemonSpecies.id),
  encounterRate: real("encounter_rate").notNull().default(0.1),
  // 0.0 to 1.0
  minLevel: integer("min_level").notNull().default(1),
  maxLevel: integer("max_level").notNull().default(5),
  isTrainerEncounter: boolean("is_trainer_encounter").notNull().default(false),
  // NPC trainer vs wild
  trainerName: text("trainer_name"),
  // Name if it's a trainer encounter
  createdAt: timestamp("created_at").defaultNow()
});
var items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // "Burble Ball", "Healing Potion", "Repel"
  description: text("description"),
  type: text("type").notNull(),
  // "capture", "healing", "utility"
  effect: text("effect").notNull(),
  // JSON object describing item effects
  basePrice: integer("base_price").notNull().default(100),
  // Cost in shop
  iconEmoji: text("icon_emoji").notNull().default("\u26A1"),
  isConsumable: boolean("is_consumable").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var playerInventory = pgTable("player_inventory", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow()
});
var playerEconomy = pgTable("player_economy", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  money: integer("money").notNull().default(500),
  // Starting money
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  lastTransaction: timestamp("last_transaction").defaultNow()
});
var battleRecords = pgTable("battle_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => users.id),
  playerBurblemonId: integer("player_burblemon_id").notNull().references(() => playerBurblemons.id),
  opponentType: text("opponent_type").notNull(),
  // "wild", "trainer", "boss"
  opponentId: integer("opponent_id"),
  // Species ID for wild, encounter ID for trainers
  battleResult: text("battle_result").notNull(),
  // "victory", "defeat", "capture", "flee"
  xpGained: integer("xp_gained").notNull().default(0),
  moneyGained: integer("money_gained").notNull().default(0),
  itemsUsed: text("items_used").default("[]"),
  // JSON array of item IDs used
  battleDuration: integer("battle_duration"),
  // Seconds
  battleDate: timestamp("battle_date").defaultNow()
});
var insertBurblemonSpeciesSchema = createInsertSchema(burblemonSpecies).pick({
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
  description: true
});
var insertBurblemonFormSchema = createInsertSchema(burblemonForms).pick({
  speciesId: true,
  formName: true,
  evolutionLevel: true,
  hpMultiplier: true,
  attackMultiplier: true,
  defenseMultiplier: true,
  speedMultiplier: true,
  iconEmoji: true,
  description: true
});
var insertPlayerBurblemonSchema = createInsertSchema(playerBurblemons).pick({
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
  isStarter: true
});
var insertMapZoneSchema = createInsertSchema(mapZones).pick({
  name: true,
  description: true,
  requiredLevel: true,
  isTutorial: true,
  colorTheme: true,
  iconEmoji: true,
  backgroundImage: true
});
var insertZonePathSchema = createInsertSchema(zonePaths).pick({
  fromZoneId: true,
  toZoneId: true,
  requiresBossDefeat: true
});
var insertPlayerMapProgressSchema = createInsertSchema(playerMapProgress).pick({
  playerId: true,
  currentZoneId: true,
  unlockedZones: true,
  defeatedBosses: true,
  tutorialCompleted: true
});
var insertWildEncounterSchema = createInsertSchema(wildEncounters).pick({
  zoneId: true,
  speciesId: true,
  encounterRate: true,
  minLevel: true,
  maxLevel: true,
  isTrainerEncounter: true,
  trainerName: true
});
var insertItemSchema = createInsertSchema(items).pick({
  name: true,
  description: true,
  type: true,
  effect: true,
  basePrice: true,
  iconEmoji: true,
  isConsumable: true
});
var insertPlayerInventorySchema = createInsertSchema(playerInventory).pick({
  playerId: true,
  itemId: true,
  quantity: true
});
var insertPlayerEconomySchema = createInsertSchema(playerEconomy).pick({
  playerId: true,
  money: true,
  totalEarned: true,
  totalSpent: true
});
var insertBattleRecordSchema = createInsertSchema(battleRecords).pick({
  playerId: true,
  playerBurblemonId: true,
  opponentType: true,
  opponentId: true,
  battleResult: true,
  xpGained: true,
  moneyGained: true,
  itemsUsed: true,
  battleDuration: true
});
var geoMaps = pgTable("geo_maps", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  // "us_states", "asia_countries", etc.
  name: text("name").notNull(),
  // "United States", "Asia", etc.
  description: text("description"),
  totalRegions: integer("total_regions").notNull(),
  // 50 for US states, varies for continents
  mapType: text("map_type").notNull(),
  // "countries", "states", "provinces"
  difficulty: text("difficulty").notNull().default("medium"),
  // "easy", "medium", "hard"
  rewardMultiplier: real("reward_multiplier").notNull().default(1),
  svgViewBox: text("svg_viewbox"),
  // SVG viewBox for proper scaling
  isActive: boolean("is_active").notNull().default(true)
});
var geoRegions = pgTable("geo_regions", {
  id: serial("id").primaryKey(),
  mapId: integer("map_id").notNull().references(() => geoMaps.id),
  code: text("code").notNull(),
  // "CA", "TX", "CN", "JP" - short codes
  name: text("name").notNull(),
  // "California", "Texas", "China", "Japan"
  fullName: text("full_name"),
  // "State of California", "People's Republic of China"
  capital: text("capital"),
  // Capital city if applicable
  svgPath: text("svg_path").notNull(),
  // SVG path data for the region shape
  centroidX: real("centroid_x"),
  // X coordinate for label positioning
  centroidY: real("centroid_y"),
  // Y coordinate for label positioning
  difficulty: text("difficulty").default("medium"),
  hints: text("hints").array()
  // Array of hint strings
});
var geoGameResults = pgTable("geo_game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mapId: integer("map_id").notNull().references(() => geoMaps.id),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent"),
  // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
  streakBonus: integer("streak_bonus").default(0),
  hintsUsed: integer("hints_used").default(0)
});
var geoMapsRelations = relations(geoMaps, ({ many }) => ({
  regions: many(geoRegions),
  results: many(geoGameResults)
}));
var geoRegionsRelations = relations(geoRegions, ({ one }) => ({
  map: one(geoMaps, {
    fields: [geoRegions.mapId],
    references: [geoMaps.id]
  })
}));
var geoGameResultsRelations = relations(geoGameResults, ({ one }) => ({
  user: one(users, {
    fields: [geoGameResults.userId],
    references: [users.id]
  }),
  map: one(geoMaps, {
    fields: [geoGameResults.mapId],
    references: [geoMaps.id]
  })
}));
var insertGeoMapSchema = createInsertSchema(geoMaps).pick({
  key: true,
  name: true,
  description: true,
  totalRegions: true,
  mapType: true,
  difficulty: true,
  rewardMultiplier: true,
  svgViewBox: true,
  isActive: true
});
var insertGeoRegionSchema = createInsertSchema(geoRegions).pick({
  mapId: true,
  code: true,
  name: true,
  fullName: true,
  capital: true,
  svgPath: true,
  centroidX: true,
  centroidY: true,
  difficulty: true,
  hints: true
});
var insertGeoGameResultSchema = createInsertSchema(geoGameResults).pick({
  userId: true,
  mapId: true,
  score: true,
  maxScore: true,
  correctAnswers: true,
  totalQuestions: true,
  timeSpent: true,
  streakBonus: true,
  hintsUsed: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
var DatabaseStorage = class {
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: "session"
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    if (!email) return void 0;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async updateUser(userId, updates) {
    try {
      const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      return updatedUser || null;
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  }
  async updateUserScore(userId, scoreChange) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const [updatedUser] = await db.update(users).set({ score: user.score + scoreChange }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async updateBotBattleResult(userId, won) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const botWins = (user.botWins || 0) + (won ? 1 : 0);
    const botLosses = (user.botLosses || 0) + (won ? 0 : 1);
    let botDifficultyLevel = user.botDifficultyLevel || 1;
    if (won) {
      const recentWins = Math.max(0, botWins - botLosses);
      if (recentWins > 0 && recentWins % 2 === 0 && botDifficultyLevel < 10) {
        botDifficultyLevel = Math.min(10, botDifficultyLevel + 1);
      }
    } else {
      const recentLosses = Math.max(0, botLosses - botWins);
      if (recentLosses > 0 && recentLosses % 3 === 0 && botDifficultyLevel > 1) {
        botDifficultyLevel = Math.max(1, botDifficultyLevel - 1);
      }
    }
    const [updatedUser] = await db.update(users).set({
      botWins,
      botLosses,
      botDifficultyLevel
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  async removeUsersByEmail(emailPattern) {
    const usersToRemove = await db.select().from(users).where(
      sql`${users.email} ILIKE ${`%${emailPattern}%`}`
    );
    for (const user of usersToRemove) {
      console.log(`Removing user with inappropriate email: ${user.username} (ID: ${user.id})`);
      await db.delete(userFavorites).where(eq(userFavorites.userId, user.id));
      await db.delete(userProgress).where(eq(userProgress.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  }
  // Category operations
  async getAllCategories() {
    return db.select().from(categories);
  }
  async getCategoryById(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  async getCategoryByName(name) {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  // Riddle operations
  async getAllRiddles() {
    return db.select().from(riddles);
  }
  async getRiddleById(id) {
    const [riddle] = await db.select().from(riddles).where(eq(riddles.id, id));
    return riddle;
  }
  async getRiddlesByCategory(categoryId) {
    return db.select().from(riddles).where(eq(riddles.categoryId, categoryId));
  }
  async getRiddlesWithCategories() {
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
    }).from(riddles).innerJoin(categories, eq(riddles.categoryId, categories.id));
    return result.map((r) => ({
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
  async createRiddle(riddle) {
    const [newRiddle] = await db.insert(riddles).values({
      ...riddle,
      avgSolveTimeSeconds: 0
    }).returning();
    return newRiddle;
  }
  // User progress operations
  async getUserProgress(userId) {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  async getUserRiddleProgress(userId, riddleId) {
    const [progress] = await db.select().from(userProgress).where(and(
      eq(userProgress.userId, userId),
      eq(userProgress.riddleId, riddleId)
    ));
    return progress;
  }
  async createOrUpdateUserProgress(progress) {
    const existingProgress = await this.getUserRiddleProgress(
      progress.userId,
      progress.riddleId
    );
    if (existingProgress) {
      const [updatedProgress] = await db.update(userProgress).set(progress).where(eq(userProgress.id, existingProgress.id)).returning();
      if (progress.solved && !existingProgress.solved) {
        await this.updateUserStatsAfterSolve(
          progress.userId,
          progress.timeToSolveSeconds || 0,
          progress.riddleId
        );
      }
      return updatedProgress;
    } else {
      const [newProgress] = await db.insert(userProgress).values({
        ...progress,
        solvedAt: progress.solved ? /* @__PURE__ */ new Date() : null
      }).returning();
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
  async updateUserStatsAfterSolve(userId, timeToSolveSeconds, riddleId) {
    const user = await this.getUser(userId);
    if (!user) return;
    const totalSolveTime = user.avgTimeSeconds * user.solvedCount + timeToSolveSeconds;
    const newSolvedCount = user.solvedCount + 1;
    const newAvgTime = Math.round(totalSolveTime / newSolvedCount);
    const riddle = await this.getRiddleById(riddleId);
    if (!riddle) return;
    const category = await this.getCategoryById(riddle.categoryId);
    if (!category) return;
    let burbleCount = user.burbleCount || 0;
    let valentineCount = user.valentineCount || 0;
    let emojiCount = user.emojiCount || 0;
    let brainTeaserCount = user.brainTeaserCount || 0;
    const categoryName = category.name.toLowerCase();
    if (categoryName.includes("burble")) {
      burbleCount++;
    } else if (categoryName.includes("valentine") || categoryName.includes("ev special")) {
      valentineCount++;
    } else if (categoryName.includes("emoji")) {
      emojiCount++;
    } else {
      brainTeaserCount++;
    }
    await db.update(users).set({
      solvedCount: newSolvedCount,
      avgTimeSeconds: newAvgTime,
      burbleCount,
      valentineCount,
      emojiCount,
      brainTeaserCount
    }).where(eq(users.id, userId));
  }
  async getUserStats(userId) {
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
  async getAllUsers() {
    const allUsers = await db.select().from(users).orderBy(users.score, "desc");
    return allUsers;
  }
  // User favorite operations
  async getUserFavorites(userId) {
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
    }).from(userFavorites).innerJoin(riddles, eq(userFavorites.riddleId, riddles.id)).innerJoin(categories, eq(riddles.categoryId, categories.id)).where(eq(userFavorites.userId, userId)).orderBy(userFavorites.addedAt, "desc");
    return result.map((f) => ({
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
  async toggleUserFavorite(userId, riddleId) {
    const existing = await db.select().from(userFavorites).where(and(
      eq(userFavorites.userId, userId),
      eq(userFavorites.riddleId, riddleId)
    ));
    if (existing.length > 0) {
      await db.delete(userFavorites).where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.riddleId, riddleId)
      ));
      return { added: false };
    } else {
      await db.insert(userFavorites).values({
        userId,
        riddleId
      });
      return { added: true };
    }
  }
  async isRiddleFavorited(userId, riddleId) {
    const result = await db.select().from(userFavorites).where(and(
      eq(userFavorites.userId, userId),
      eq(userFavorites.riddleId, riddleId)
    ));
    return result.length > 0;
  }
  // Multiplayer game operations
  async getRandomRiddlesByCategory(categoryId, count) {
    return db.select().from(riddles).where(eq(riddles.categoryId, categoryId)).orderBy(sql`RANDOM()`).limit(count);
  }
  async createGameSession(sessionData) {
    const [session3] = await db.insert(gameSessions).values(sessionData).returning();
    return session3;
  }
  async getGameSessionByCode(sessionCode) {
    const [session3] = await db.select().from(gameSessions).where(eq(gameSessions.sessionCode, sessionCode));
    return session3;
  }
  async getGameSessionWithParticipants(sessionId) {
    const session3 = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId));
    if (session3.length === 0) return void 0;
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
    }).from(gameParticipants).innerJoin(users, eq(gameParticipants.userId, users.id)).where(eq(gameParticipants.sessionId, sessionId));
    const category = session3[0].categoryId ? await this.getCategoryById(session3[0].categoryId) : void 0;
    return {
      ...session3[0],
      participants: participants.map((p) => ({
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
          password: "",
          // Don't expose password
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
  async joinGameSession(sessionId, userId) {
    const existing = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
    if (existing.length > 0) {
      return existing[0];
    }
    const [participant] = await db.insert(gameParticipants).values({
      sessionId,
      userId
    }).returning();
    return participant;
  }
  async markPlayerReady(sessionId, userId) {
    await db.update(gameParticipants).set({ isReady: true }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async startGameSession(sessionId) {
    await db.update(gameSessions).set({
      status: "active",
      startedAt: /* @__PURE__ */ new Date()
    }).where(eq(gameSessions.id, sessionId));
  }
  async updateGameQuestionIndex(sessionId, questionIndex) {
    await db.update(gameSessions).set({ currentQuestionIndex: questionIndex }).where(eq(gameSessions.id, sessionId));
  }
  async finishGameSession(sessionId) {
    await db.update(gameSessions).set({
      status: "finished",
      finishedAt: /* @__PURE__ */ new Date()
    }).where(eq(gameSessions.id, sessionId));
  }
  async saveGameAnswer(answerData) {
    const [answer] = await db.insert(gameAnswers).values(answerData).returning();
    return answer;
  }
  async updateParticipantScore(sessionId, userId, points) {
    const participant = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
    if (participant.length > 0) {
      await db.update(gameParticipants).set({
        score: participant[0].score + points,
        correctAnswers: participant[0].correctAnswers + 1,
        totalAnswered: participant[0].totalAnswered + 1
      }).where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
    }
  }
  async getQuestionAnswers(sessionId, questionIndex) {
    return db.select().from(gameAnswers).where(and(
      eq(gameAnswers.sessionId, sessionId),
      eq(gameAnswers.questionIndex, questionIndex)
    ));
  }
  // Battle system operations
  async updateParticipantHP(sessionId, userId, newHP) {
    await db.update(gameParticipants).set({ hp: Math.max(0, newHP) }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async updateParticipantShield(sessionId, userId, hasShield) {
    await db.update(gameParticipants).set({ hasShield }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async updateParticipantCharge(sessionId, userId, chargePower) {
    await db.update(gameParticipants).set({ chargePower }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async updateParticipantBattleAction(sessionId, userId, action) {
    await db.update(gameParticipants).set({ lastAction: action }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async processBattleAction(sessionId, attackerId, targetId, action, baseDamage = 10) {
    const [attacker] = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, attackerId)
    ));
    const [target] = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, targetId)
    ));
    if (!attacker || !target) {
      throw new Error("Participant not found");
    }
    let damage = 0;
    let shieldBroken = false;
    let targetHP = target.hp;
    if (action === "attack") {
      damage = baseDamage + attacker.chargePower;
      if (target.hasShield) {
        shieldBroken = true;
        damage = 0;
        await this.updateParticipantShield(sessionId, targetId, false);
      } else {
        targetHP = Math.max(0, target.hp - damage);
        await this.updateParticipantHP(sessionId, targetId, targetHP);
      }
      await this.updateParticipantCharge(sessionId, attackerId, 0);
    }
    return { damage, shieldBroken, targetHP };
  }
  async resetParticipantBattleStats(sessionId, userId) {
    const [participant] = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
    if (participant) {
      const spriteInfo = this.getSpriteInfo(participant.spriteType || "balanced");
      await db.update(gameParticipants).set({
        hp: spriteInfo.startingHp,
        maxHp: spriteInfo.startingHp,
        hasShield: false,
        chargePower: 0,
        lastAction: null,
        energy: spriteInfo.startingEnergy
      }).where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
    }
  }
  // Sprite system operations
  async updateParticipantSprite(sessionId, userId, spriteType) {
    const spriteInfo = this.getSpriteInfo(spriteType);
    await db.update(gameParticipants).set({
      spriteType,
      hp: spriteInfo.startingHp,
      maxHp: spriteInfo.startingHp,
      energy: spriteInfo.startingEnergy
    }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  async updateParticipantEnergy(sessionId, userId, energyDelta) {
    const [participant] = await db.select().from(gameParticipants).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
    if (participant) {
      const newEnergy = Math.max(0, participant.energy + energyDelta);
      await db.update(gameParticipants).set({ energy: newEnergy }).where(and(
        eq(gameParticipants.sessionId, sessionId),
        eq(gameParticipants.userId, userId)
      ));
    }
  }
  getSpriteInfo(spriteType) {
    switch (spriteType) {
      case "big_brain":
        return {
          startingHp: 50,
          startingEnergy: 5,
          // Starts with 5 energy
          correctBonus: 5,
          // +5 energy for correct answers
          incorrectPenalty: 5,
          // Normal HP loss for wrong answers
          hasReflect: false
        };
      case "risk_taker":
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,
          // +5 energy when correct
          incorrectPenalty: 15,
          // -15 HP when wrong (instead of -5)
          hasReflect: false
        };
      case "tank":
        return {
          startingHp: 100,
          // Starts with 100 HP instead of 50
          startingEnergy: 0,
          correctBonus: 5,
          // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: false
        };
      case "reflector":
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,
          // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: true
          // Can use reflect instead of shield
        };
      default:
        return {
          startingHp: 50,
          startingEnergy: 0,
          correctBonus: 5,
          // +5 energy for correct answers
          incorrectPenalty: 5,
          hasReflect: false
        };
    }
  }
  // Bot functionality
  async createBotUser() {
    const botUsername = `Bot_${Math.random().toString(36).substring(2, 8)}`;
    const [bot] = await db.insert(users).values({
      username: botUsername,
      password: "bot_password",
      // Dummy password for bot
      email: `${botUsername}@bot.ai`,
      isVerified: true
    }).returning();
    return bot;
  }
  async addBotToSession(sessionId, hostUserId) {
    const bot = await this.createBotUser();
    const spriteTypes = ["big_brain", "risk_taker", "tank", "reflector", "balanced"];
    const randomSprite = spriteTypes[Math.floor(Math.random() * spriteTypes.length)];
    const spriteInfo = this.getSpriteInfo(randomSprite);
    let difficultyMultiplier = 1;
    if (hostUserId) {
      const host = await this.getUser(hostUserId);
      if (host) {
        const botLevel = host.botDifficultyLevel || 1;
        difficultyMultiplier = 1 + (botLevel - 1) * 0.11;
      }
    }
    const scaledHp = Math.round(spriteInfo.startingHp * difficultyMultiplier);
    const scaledEnergy = Math.round(spriteInfo.startingEnergy * difficultyMultiplier);
    const [participant] = await db.insert(gameParticipants).values({
      sessionId,
      userId: bot.id,
      hp: scaledHp,
      maxHp: scaledHp,
      energy: scaledEnergy,
      spriteType: randomSprite,
      isReady: true
      // Bots are always ready
    }).returning();
    return { ...participant, user: bot };
  }
  async getBotAnswer(riddle) {
    const isCorrect = Math.random() < 0.7;
    const timeToAnswer = Math.floor(Math.random() * 15) + 5;
    let answer = "";
    if (isCorrect) {
      answer = riddle.answer;
    } else {
      answer = `Wrong answer ${Math.floor(Math.random() * 100)}`;
    }
    return { answer, isCorrect, timeToAnswer };
  }
  async getBotBattleAction(participant) {
    const energy = participant.energy || 0;
    const availableActions = [];
    if (energy >= 5) availableActions.push("attack");
    if (energy >= 2) availableActions.push("charge");
    const spriteInfo = this.getSpriteInfo(participant.spriteType || "balanced");
    if (spriteInfo.hasReflect && energy >= 5) {
      availableActions.push("reflect");
    } else if (energy >= 3) {
      availableActions.push("shield");
    }
    if (availableActions.length === 0) return "skip";
    if (availableActions.includes("attack") && Math.random() < 0.6) {
      return "attack";
    }
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }
  async initializeParticipantWithSprite(sessionId, userId, spriteType) {
    const spriteInfo = this.getSpriteInfo(spriteType);
    await db.update(gameParticipants).set({
      spriteType,
      hp: spriteInfo.startingHp,
      maxHp: spriteInfo.startingHp,
      energy: spriteInfo.startingEnergy,
      hasShield: false,
      chargePower: 0,
      lastAction: null
    }).where(and(
      eq(gameParticipants.sessionId, sessionId),
      eq(gameParticipants.userId, userId)
    ));
  }
  // Audio track operations
  async getAllAudioTracks() {
    const tracks = await db.select().from(audioTracks);
    return tracks;
  }
  async getAudioTrackById(id) {
    const [track] = await db.select().from(audioTracks).where(eq(audioTracks.id, id));
    return track;
  }
  async getAudioTracksByUser(userId) {
    const tracks = await db.select().from(audioTracks).where(eq(audioTracks.uploadedBy, userId));
    return tracks;
  }
  async createAudioTrack(track) {
    const [newTrack] = await db.insert(audioTracks).values(track).returning();
    return newTrack;
  }
  async updateAudioTrack(id, updates) {
    const [updatedTrack] = await db.update(audioTracks).set(updates).where(eq(audioTracks.id, id)).returning();
    if (!updatedTrack) {
      throw new Error(`Audio track with ID ${id} not found`);
    }
    return updatedTrack;
  }
  async deleteAudioTrack(id) {
    const result = await db.delete(audioTracks).where(eq(audioTracks.id, id));
  }
  // Quiz operations for solo dungeon
  async getAllQuizTopics() {
    return db.select().from(quizTopics);
  }
  async getQuizTopicById(id) {
    const [topic] = await db.select().from(quizTopics).where(eq(quizTopics.id, id));
    return topic;
  }
  async getQuizTopicWithQuestions(id) {
    const topic = await this.getQuizTopicById(id);
    if (!topic) return void 0;
    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.topicId, id));
    return { ...topic, questions };
  }
  async createQuizTopic(topic) {
    const [newTopic] = await db.insert(quizTopics).values(topic).returning();
    return newTopic;
  }
  async getQuestionsByTopic(topicId, difficulty, limit = 10) {
    let whereConditions = [eq(quizQuestions.topicId, topicId)];
    if (difficulty) {
      whereConditions.push(eq(quizQuestions.difficulty, difficulty));
    }
    const questions = await db.select().from(quizQuestions).where(and(...whereConditions)).limit(limit);
    return questions;
  }
  async createQuizQuestion(question) {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }
  async validateQuizAnswer(questionId, userAnswer) {
    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId));
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }
    const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    return {
      isCorrect,
      explanation: question.explanation || void 0,
      energyReward: isCorrect ? question.energyReward : 0
    };
  }
  // Dungeon run operations
  async createDungeonRun(run) {
    const [newRun] = await db.insert(dungeonRuns).values(run).returning();
    return newRun;
  }
  async getDungeonRun(id) {
    const [run] = await db.select().from(dungeonRuns).where(eq(dungeonRuns.id, id));
    return run;
  }
  async updateDungeonRun(id, updates) {
    const [updatedRun] = await db.update(dungeonRuns).set(updates).where(eq(dungeonRuns.id, id)).returning();
    if (!updatedRun) {
      throw new Error(`Dungeon run with ID ${id} not found`);
    }
    return updatedRun;
  }
  async getActiveDungeonRun(playerId) {
    let whereConditions = [eq(dungeonRuns.isActive, true)];
    if (playerId) {
      whereConditions.push(eq(dungeonRuns.playerId, playerId));
    } else {
      whereConditions.push(sql`${dungeonRuns.playerId} IS NULL`);
    }
    const [run] = await db.select().from(dungeonRuns).where(and(...whereConditions)).limit(1);
    return run;
  }
  // Burblemon species operations
  async getAllBurblemonSpecies() {
    return db.select().from(burblemonSpecies);
  }
  async getBurblemonSpeciesById(id) {
    const [species] = await db.select().from(burblemonSpecies).where(eq(burblemonSpecies.id, id));
    return species;
  }
  async getBurblemonSpeciesByName(name) {
    const [species] = await db.select().from(burblemonSpecies).where(eq(burblemonSpecies.name, name));
    return species;
  }
  async createBurblemonSpecies(species) {
    const [newSpecies] = await db.insert(burblemonSpecies).values(species).returning();
    return newSpecies;
  }
  // Player Burblemon operations
  async getPlayerBurblemons(userId) {
    return db.select().from(playerBurblemons).where(eq(playerBurblemons.userId, userId));
  }
  async getPlayerBurblemonById(id) {
    const [burblemon] = await db.select().from(playerBurblemons).where(eq(playerBurblemons.id, id));
    return burblemon;
  }
  async createPlayerBurblemon(burblemon) {
    const [newBurblemon] = await db.insert(playerBurblemons).values(burblemon).returning();
    return newBurblemon;
  }
  async updatePlayerBurblemon(id, updates) {
    const [updatedBurblemon] = await db.update(playerBurblemons).set(updates).where(eq(playerBurblemons.id, id)).returning();
    if (!updatedBurblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }
    return updatedBurblemon;
  }
  async levelUpBurblemon(id) {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }
    const newLevel = burblemon.level + 1;
    const expNeededForNextLevel = newLevel * 100;
    if (burblemon.experience < expNeededForNextLevel) {
      throw new Error("Not enough experience to level up");
    }
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
  async evolveBurblemon(id, newSpeciesId) {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }
    const newSpecies = await this.getBurblemonSpeciesById(newSpeciesId);
    if (!newSpecies) {
      throw new Error(`Burblemon species with ID ${newSpeciesId} not found`);
    }
    const levelMultiplier = 1 + (burblemon.level - 1) * 0.1;
    const newMaxHp = Math.floor(newSpecies.baseHp * levelMultiplier);
    const newAttack = Math.floor(newSpecies.baseAttack * levelMultiplier);
    const newDefense = Math.floor(newSpecies.baseDefense * levelMultiplier);
    const newSpeed = Math.floor(newSpecies.baseSpeed * levelMultiplier);
    return this.updatePlayerBurblemon(id, {
      speciesId: newSpeciesId,
      maxHp: newMaxHp,
      currentHp: newMaxHp,
      // Full heal on evolution
      currentAttack: newAttack,
      currentDefense: newDefense,
      currentSpeed: newSpeed
    });
  }
  async healBurblemon(id) {
    const burblemon = await this.getPlayerBurblemonById(id);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${id} not found`);
    }
    return this.updatePlayerBurblemon(id, {
      currentHp: burblemon.maxHp,
      statusConditions: []
    });
  }
  async gainBurblemonXP(burblemonId, xp) {
    const burblemon = await this.getPlayerBurblemonById(burblemonId);
    if (!burblemon) {
      throw new Error(`Player Burblemon with ID ${burblemonId} not found`);
    }
    const newXP = burblemon.xp + xp;
    const xpNeededForNextLevel = burblemon.level * 100;
    if (newXP >= xpNeededForNextLevel) {
      const newLevel = burblemon.level + 1;
      const remainingXP = newXP - xpNeededForNextLevel;
      const hpIncrease = Math.floor(burblemon.maxHp * 0.1);
      const attackIncrease = Math.floor(burblemon.attack * 0.1);
      const defenseIncrease = Math.floor(burblemon.defense * 0.1);
      const speedIncrease = Math.floor(burblemon.speed * 0.1);
      await this.updatePlayerBurblemon(burblemonId, {
        level: newLevel,
        xp: remainingXP,
        maxHp: burblemon.maxHp + hpIncrease,
        currentHp: burblemon.currentHp + hpIncrease,
        // Heal on level up
        attack: burblemon.attack + attackIncrease,
        defense: burblemon.defense + defenseIncrease,
        speed: burblemon.speed + speedIncrease
      });
    } else {
      await this.updatePlayerBurblemon(burblemonId, {
        xp: newXP
      });
    }
  }
  async getPlayerStarterBurblemons(userId) {
    return db.select().from(playerBurblemons).where(and(
      eq(playerBurblemons.userId, userId),
      eq(playerBurblemons.isStarter, true)
    ));
  }
  // Map zones and progression
  async getAllMapZones() {
    return db.select().from(mapZones);
  }
  async getMapZoneById(id) {
    const [zone] = await db.select().from(mapZones).where(eq(mapZones.id, id));
    return zone;
  }
  async getMapZonesByDifficulty(difficulty) {
    return db.select().from(mapZones).where(eq(mapZones.difficultyLevel, difficulty));
  }
  async createMapZone(zone) {
    const [newZone] = await db.insert(mapZones).values(zone).returning();
    return newZone;
  }
  async getZonePaths(fromZoneId) {
    if (fromZoneId) {
      return db.select().from(zonePaths).where(eq(zonePaths.fromZoneId, fromZoneId));
    }
    return db.select().from(zonePaths);
  }
  async createZonePath(path3) {
    const [newPath] = await db.insert(zonePaths).values(path3).returning();
    return newPath;
  }
  async getPlayerMapProgress(userId) {
    const [progress] = await db.select().from(playerMapProgress).where(eq(playerMapProgress.userId, userId));
    return progress;
  }
  async createOrUpdatePlayerMapProgress(progress) {
    const existing = await this.getPlayerMapProgress(progress.userId);
    if (existing) {
      const [updated] = await db.update(playerMapProgress).set(progress).where(eq(playerMapProgress.userId, progress.userId)).returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(playerMapProgress).values(progress).returning();
      return newProgress;
    }
  }
  async unlockZoneForPlayer(userId, zoneId) {
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
  async getWildEncountersByZone(zoneId) {
    return db.select().from(wildEncounters).where(eq(wildEncounters.zoneId, zoneId));
  }
  async createWildEncounter(encounter) {
    const [newEncounter] = await db.insert(wildEncounters).values(encounter).returning();
    return newEncounter;
  }
  async generateRandomWildEncounter(zoneId) {
    const encounters = await this.getWildEncountersByZone(zoneId);
    if (encounters.length === 0) return void 0;
    const totalWeight = encounters.reduce((sum, enc) => sum + enc.encounterRate, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    for (const encounter of encounters) {
      currentWeight += encounter.encounterRate;
      if (random <= currentWeight) {
        return this.getBurblemonSpeciesById(encounter.speciesId);
      }
    }
    return void 0;
  }
  // Items and inventory
  async getAllItems() {
    return db.select().from(items);
  }
  async getItemById(id) {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }
  async getItemsByType(itemType) {
    return db.select().from(items).where(eq(items.itemType, itemType));
  }
  async createItem(item) {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }
  async getPlayerInventory(userId) {
    return db.select().from(playerInventory).where(eq(playerInventory.userId, userId));
  }
  async addItemToInventory(userId, itemId, quantity) {
    const existing = await db.select().from(playerInventory).where(and(
      eq(playerInventory.userId, userId),
      eq(playerInventory.itemId, itemId)
    ));
    if (existing.length > 0) {
      const [updated] = await db.update(playerInventory).set({ quantity: existing[0].quantity + quantity }).where(and(
        eq(playerInventory.userId, userId),
        eq(playerInventory.itemId, itemId)
      )).returning();
      return updated;
    } else {
      const [newInventoryItem] = await db.insert(playerInventory).values({ userId, itemId, quantity }).returning();
      return newInventoryItem;
    }
  }
  async removeItemFromInventory(userId, itemId, quantity) {
    const existing = await db.select().from(playerInventory).where(and(
      eq(playerInventory.userId, userId),
      eq(playerInventory.itemId, itemId)
    ));
    if (existing.length === 0 || existing[0].quantity < quantity) {
      return false;
    }
    const newQuantity = existing[0].quantity - quantity;
    if (newQuantity === 0) {
      await db.delete(playerInventory).where(and(
        eq(playerInventory.userId, userId),
        eq(playerInventory.itemId, itemId)
      ));
    } else {
      await db.update(playerInventory).set({ quantity: newQuantity }).where(and(
        eq(playerInventory.userId, userId),
        eq(playerInventory.itemId, itemId)
      ));
    }
    return true;
  }
  async useItem(userId, itemId, targetBurblemonId) {
    const item = await this.getItemById(itemId);
    if (!item) {
      return { success: false, message: "Item not found" };
    }
    const hasItem = await this.removeItemFromInventory(userId, itemId, 1);
    if (!hasItem) {
      return { success: false, message: "You do not have this item" };
    }
    switch (item.itemType) {
      case "healing":
        if (targetBurblemonId) {
          await this.healBurblemon(targetBurblemonId);
          return { success: true, message: `Used ${item.name} to heal your Burblemon!` };
        }
        return { success: false, message: "Select a Burblemon to heal" };
      case "pokeball":
        return { success: true, message: `Used ${item.name}! (Capture logic to be implemented)` };
      default:
        return { success: true, message: `Used ${item.name}!` };
    }
  }
  // Economy operations
  async getPlayerEconomy(userId) {
    const [economy] = await db.select().from(playerEconomy).where(eq(playerEconomy.userId, userId));
    return economy;
  }
  async createPlayerEconomy(economy) {
    const [newEconomy] = await db.insert(playerEconomy).values(economy).returning();
    return newEconomy;
  }
  async updatePlayerMoney(userId, amount) {
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
    const [updated] = await db.update(playerEconomy).set({
      money: newMoney,
      totalMoneyEarned: totalEarned,
      totalMoneySpent: totalSpent
    }).where(eq(playerEconomy.userId, userId)).returning();
    return updated;
  }
  async processPurchase(userId, itemId, quantity) {
    const item = await this.getItemById(itemId);
    if (!item) {
      return { success: false, message: "Item not found" };
    }
    const economy = await this.getPlayerEconomy(userId);
    const totalCost = item.buyPrice * quantity;
    if (!economy || economy.money < totalCost) {
      return { success: false, message: "Not enough money" };
    }
    await this.updatePlayerMoney(userId, -totalCost);
    await this.addItemToInventory(userId, itemId, quantity);
    return { success: true, message: `Purchased ${quantity}x ${item.name} for ${totalCost} coins!` };
  }
  // Battle records
  async getBattleRecords(userId) {
    return db.select().from(battleRecords).where(eq(battleRecords.userId, userId));
  }
  async createBattleRecord(record) {
    const [newRecord] = await db.insert(battleRecords).values(record).returning();
    return newRecord;
  }
  async getPlayerBattleStats(userId) {
    const records = await this.getBattleRecords(userId);
    const wins = records.filter((r) => r.result === "win").length;
    const losses = records.filter((r) => r.result === "loss").length;
    const totalBattles = records.length;
    return { wins, losses, totalBattles };
  }
  // Geography game operations
  async getAllGeoMaps() {
    return db.select().from(geoMaps).where(eq(geoMaps.isActive, true));
  }
  async getGeoMapById(id) {
    const [map] = await db.select().from(geoMaps).where(eq(geoMaps.id, id));
    return map;
  }
  async getGeoMapByKey(key) {
    const [map] = await db.select().from(geoMaps).where(eq(geoMaps.key, key));
    if (!map) return void 0;
    const regions = await db.select().from(geoRegions).where(eq(geoRegions.mapId, map.id));
    return { ...map, regions };
  }
  async createGeoMap(map) {
    const [newMap] = await db.insert(geoMaps).values(map).returning();
    return newMap;
  }
  async getGeoRegionsByMap(mapId) {
    return db.select().from(geoRegions).where(eq(geoRegions.mapId, mapId));
  }
  async createGeoRegion(region) {
    const [newRegion] = await db.insert(geoRegions).values(region).returning();
    return newRegion;
  }
  async submitGeoGameResult(result) {
    if (result.score > 0) {
      await this.updateUserScore(result.userId, result.score);
    }
    const [newResult] = await db.insert(geoGameResults).values(result).returning();
    return newResult;
  }
  async getPlayerGeoHighScores(userId, mapId) {
    const query = db.select().from(geoGameResults).where(eq(geoGameResults.userId, userId));
    if (mapId) {
      query.where(and(eq(geoGameResults.userId, userId), eq(geoGameResults.mapId, mapId)));
    }
    return query.orderBy(sql`${geoGameResults.score} DESC`).limit(10);
  }
  async getGeoLeaderboard(mapId, limit = 10) {
    return db.select({
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
    }).from(geoGameResults).leftJoin(users, eq(geoGameResults.userId, users.id)).where(eq(geoGameResults.mapId, mapId)).orderBy(sql`${geoGameResults.score} DESC`).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";

// server/ai-service.ts
import fetch2 from "node-fetch";
async function callPerplexityAPI(messages) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY environment variable is not set");
  }
  const response = await fetch2("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages,
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: [],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      stream: false,
      frequency_penalty: 1
    })
  });
  if (!response.ok) {
    const text2 = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${text2}`);
  }
  return await response.json();
}
async function getAIHint(req, res) {
  try {
    const { riddle, isQuestion } = req.body;
    if (!riddle) {
      return res.status(400).json({ error: "Riddle is required" });
    }
    const isEmojiPuzzle = riddle.includes("emoji");
    let messages;
    if (isQuestion) {
      messages = [
        {
          role: "system",
          content: `You are an assistant for a riddle game called "Are You My Valentine?". In this game, middle school students ask yes/no questions to figure out the answer. The user's message will contain their question followed by "(The answer is: X)" where X is the actual answer.

IMPORTANT: NEVER REVEAL THE ANSWER "X" IN YOUR RESPONSES:
1. NEVER say the answer name or title directly
2. NEVER mention specific character names
3. NEVER mention specific places
4. NEVER mention actors, dates, or unique story elements

Your answers should be simple, clear, and kid-friendly (grade 5-8 reading level).

For example, if the question asks "Does it have gills?" and the answer is "Avatar", then say "No. This doesn't have gills. The characters breathe differently."

ALWAYS start with "Yes" or "No", then give a SHORT, SIMPLE explanation. If they guess correctly, say "Yes, that's correct!" without repeating the answer.

RULES:
1. Use simple words middle schoolers understand
2. Keep answers to 1-2 short sentences
3. Be factual and accurate
4. Be helpful without giving away too much

Examples:
Question: "Is it an animal? (The answer is: Elephant)"
Response: "Yes. This is a large animal with gray skin."

Question: "Can it fly? (The answer is: Penguin)"
Response: "No. This bird swims instead of flying."

Question: "Is it blue? (The answer is: Avatar)"
Response: "Yes. There are blue characters in this movie."

Question: "Is it Superman? (The answer is: Superman)"
Response: "Yes, that's correct!"

Keep answers simple, short, and easy to understand for kids. Never use complex words or give away the exact answer.`
        },
        {
          role: "user",
          content: `This is a yes/no question related to the riddle I'm thinking of. Please answer honestly and accurately: "${riddle}"`
        }
      ];
    } else if (isEmojiPuzzle) {
      messages = [
        {
          role: "system",
          content: `You are an assistant helping middle school students (grades 5-8) solve emoji puzzles. Your hints should be:

1. SUPER CLEAR - Use the simplest language possible that kids understand
2. DIRECTLY HELPFUL - Give a meaningful clue about what the emojis are trying to represent
3. CONCRETE - Avoid abstract concepts and focus on things kids can visualize
4. SHORT - Keep to 1 short sentence only

IMPORTANT RULES:
- NEVER prefix your hint with "Here's a hint:" or similar phrases
- NEVER add commentary about the hint quality (like "This is a fun hint")
- NEVER refer to yourself or the student in the hint
- JUST provide the direct hint and nothing else
- Your entire response should be 15 words or less

Focus on WHAT the emoji sequence represents, not on describing the emojis themselves.`
        },
        {
          role: "user",
          content: `Provide a simple, direct hint for this emoji puzzle: "${riddle}". Just give the hint with no introduction or explanation. Focus only on what the emojis represent.`
        }
      ];
    } else {
      messages = [
        {
          role: "system",
          content: `You are an assistant that provides helpful hints for middle school students (grades 5-8) playing a riddle game. Create hints that are:

1. EASY TO UNDERSTAND - Use simple language a middle schooler would know
2. HELPFUL - Give real clues that actually help figure out the answer
3. CLEAR - Don't use complicated words or confusing language
4. CONCISE - Use only 1 short sentence (no more than 15 words)

IMPORTANT RULES:
- NEVER prefix your hint with "Here's a hint:" or similar phrases
- NEVER add commentary about the hint quality (like "This is a fun hint")
- NEVER refer to yourself or the student in the hint
- JUST provide the direct hint and nothing else
- Your entire response should be 15 words or less

Never give away the exact answer, but make the hint genuinely helpful.`
        },
        {
          role: "user",
          content: `Provide a direct hint for this riddle without any introduction or explanation: "${riddle}". Make it simple enough for a middle school student to understand.`
        }
      ];
    }
    const result = await callPerplexityAPI(messages);
    let hint = result.choices[0].message.content;
    hint = hint.replace(/^(here\'s a|here is a).*hint.*:/i, "");
    hint = hint.replace(/^UNIQUE AI HINT:.*:/i, "");
    hint = hint.replace(/This hint (is|gives).*$/i, "");
    hint = hint.trim();
    if (hint.startsWith('"') && hint.endsWith('"')) {
      hint = hint.substring(1, hint.length - 1).trim();
    }
    return res.json({
      hint,
      citations: result.citations || []
    });
  } catch (error) {
    console.error("AI hint error:", error);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
}
async function getNewRiddle(req, res) {
  try {
    const { category, difficulty } = req.body;
    let promptCategory = category || "any subject";
    let promptDifficulty = difficulty || "medium";
    const messages = [
      {
        role: "system",
        content: `You are a master riddle creator who specializes in creating challenging, creative, and original brain teasers. 
Create riddles that are clever and require lateral thinking. The riddles should be engaging for players of all ages, with a focus on making them fun for younger audiences without being too easy. 
Your answers should be specific but allow for some flexibility (for example, "reading between the lines" and "reading between the lines" should both be acceptable).

Format your response with these exact sections:
Question: [the riddle text]
Answer: [the exact answer]
Explanation: [a clear explanation of the wordplay, logic, or trick involved]`
      },
      {
        role: "user",
        content: `Create a new, original ${promptDifficulty} difficulty brain teaser or riddle about ${promptCategory}. The riddle should:
1. Be creative and not commonly known
2. Have a clear, unambiguous answer that could be expressed in a few words
3. Include wordplay, misdirection, or clever thinking
4. Be appropriate for all ages, especially appealing to a younger audience
5. Have an "aha!" moment when the solution is discovered

Please make sure this is completely original and not a well-known riddle.`
      }
    ];
    const result = await callPerplexityAPI(messages);
    const content = result.choices[0].message.content;
    const questionMatch = content.match(/Question:([\s\S]+?)(?=Answer:|$)/);
    const answerMatch = content.match(/Answer:([\s\S]+?)(?=Explanation:|$)/);
    const explanationMatch = content.match(/Explanation:([\s\S]+?)$/);
    const structuredRiddle = {
      question: questionMatch ? questionMatch[1].trim() : content,
      answer: answerMatch ? answerMatch[1].trim() : "",
      explanation: explanationMatch ? explanationMatch[1].trim() : "",
      citations: result.citations || []
    };
    return res.json(structuredRiddle);
  } catch (error) {
    console.error("AI riddle generation error:", error);
    return res.status(500).json({ error: "Failed to generate riddle" });
  }
}

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// server/profanity-filter.ts
var CustomFilter = class {
  constructor() {
    this.words = [];
    this.addWords(
      "shit",
      "ass",
      "fuck",
      "cunt",
      "slut",
      "bitch",
      "whore",
      "bastard",
      "pussy",
      "dick",
      "cocksucker",
      "motherfucker",
      "damn",
      "hell",
      "retard",
      "fag",
      "faggot",
      "homo",
      "nigger",
      "nigga",
      "spic",
      "wetback",
      "chink",
      "dyke",
      "kike",
      "tranny",
      "nazi",
      "piss"
    );
  }
  addWords(...words) {
    this.words.push(...words);
  }
  isProfane(text2) {
    if (!text2) return false;
    const lowerText = text2.toLowerCase();
    return this.words.some((word) => lowerText.includes(word.toLowerCase()));
  }
  clean(text2) {
    if (!text2) return "";
    let cleanedText = text2;
    this.words.forEach((word) => {
      const regex = new RegExp(word, "gi");
      cleanedText = cleanedText.replace(regex, "*".repeat(word.length));
    });
    return cleanedText;
  }
};
var filter = new CustomFilter();
function containsProfanity(text2) {
  return filter.isProfane(text2);
}
function validateUsername(username) {
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters long" };
  }
  if (username.length > 20) {
    return { valid: false, message: "Username must be no more than 20 characters long" };
  }
  if (containsProfanity(username)) {
    return { valid: false, message: "Username contains inappropriate language" };
  }
  const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validUsernameRegex.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, dots, underscores, and hyphens" };
  }
  return { valid: true };
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  const emailParts = email.split("@");
  if (containsProfanity(emailParts[0]) || containsProfanity(emailParts[1])) {
    return { valid: false, message: "Email contains inappropriate language" };
  }
  const bannedPatterns = [
    "uselssshit",
    "shit",
    "fuck",
    "ass",
    "dick",
    "pussy",
    "bitch"
  ];
  const lowerEmail = email.toLowerCase();
  for (const pattern of bannedPatterns) {
    if (lowerEmail.includes(pattern)) {
      return { valid: false, message: "This email address is not allowed" };
    }
  }
  return { valid: true };
}
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasNumber || !hasLetter) {
    return { valid: false, message: "Password must contain at least one letter and one number" };
  }
  return { valid: true };
}

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "lovingquestion-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 1 week
    },
    // Use session store from storage
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const usernameValidation = validateUsername(req.body.username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ message: usernameValidation.message });
      }
      if (req.body.email) {
        const emailValidation = validateEmail(req.body.email);
        if (!emailValidation.valid) {
          return res.status(400).json({ message: emailValidation.message });
        }
      }
      const passwordValidation = validatePassword(req.body.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        score: 0,
        solvedCount: 0,
        avgTimeSeconds: 0,
        burbleCount: 0,
        valentineCount: 0,
        emojiCount: 0,
        brainTeaserCount: 0
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error creating account" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/dictionary-service.ts
import fetch3 from "node-fetch";
var dictionaryService = {
  /**
   * Checks if a word exists in the English dictionary
   * Uses the Free Dictionary API
   * @param word The word to check
   * @returns true if the word exists, false otherwise
   */
  async isRealWord(word) {
    try {
      const cleanWord = word.trim().toLowerCase();
      if (cleanWord.length < 2) {
        return false;
      }
      const response = await fetch3(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
      return response.status === 200;
    } catch (error) {
      console.error("Error checking word in dictionary:", error);
      return true;
    }
  }
};

// server/ai-answer-checker.ts
import fetch4 from "node-fetch";
function calculateSimilarity(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          // deletion
          matrix[i][j - 1] + 1,
          // insertion
          matrix[i - 1][j - 1] + 1
          // substitution
        );
      }
    }
  }
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}
function fuzzyMatch(userAnswer, correctAnswer) {
  const normalizeText = (text2) => text2.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const userNormalized = normalizeText(userAnswer);
  const correctNormalized = normalizeText(correctAnswer);
  if (userNormalized === correctNormalized) {
    return { isCorrect: true, confidence: 1 };
  }
  const similarity = calculateSimilarity(userNormalized, correctNormalized);
  if (similarity >= 0.85) {
    return {
      isCorrect: true,
      confidence: similarity,
      explanation: `Close match: "${userAnswer}" is very similar to "${correctAnswer}"`
    };
  }
  if (similarity >= 0.6) {
    const userWords = userNormalized.split(" ");
    const correctWords = correctNormalized.split(" ");
    const hasAllMainWords = correctWords.every(
      (word) => word.length <= 2 || userWords.some(
        (userWord) => userWord.includes(word) || word.includes(userWord)
      )
    );
    if (hasAllMainWords) {
      return {
        isCorrect: true,
        confidence: similarity,
        explanation: `Partial match: "${userAnswer}" contains the key elements of "${correctAnswer}"`
      };
    }
  }
  return {
    isCorrect: false,
    confidence: similarity,
    suggestedAnswer: correctAnswer
  };
}
async function checkAnswerWithAI(userAnswer, correctAnswer, question, hint) {
  try {
    const prompt = `
You are an intelligent answer checker for riddles and brain teasers. 
Analyze if the user's answer is correct or acceptably close to the intended answer.

Question: "${question}"
${hint ? `Hint: "${hint}"` : ""}
Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"

Consider these factors:
1. Exact matches (obviously correct)
2. Synonyms and alternative words with same meaning
3. Minor spelling mistakes or typos
4. Different word forms (singular/plural, verb tenses)
5. Abbreviated forms or common nicknames
6. Different but equivalent expressions

Respond with JSON in this exact format:
{
  "isCorrect": boolean,
  "confidence": number (0.0 to 1.0),
  "explanation": "Brief explanation of why the answer is or isn't acceptable"
}

Examples:
- If correct answer is "telephone" and user says "phone" \u2192 isCorrect: true
- If correct answer is "rainbow" and user says "rainbo" \u2192 isCorrect: true (typo)
- If correct answer is "computer" and user says "banana" \u2192 isCorrect: false
- If correct answer is "car" and user says "automobile" \u2192 isCorrect: true (synonym)
    `;
    const response = await fetch4("https://api.perplexity.ai/chat/completions", {
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
            content: "You are a precise answer checker. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0].message.content;
    try {
      const result = JSON.parse(content);
      return {
        isCorrect: result.isCorrect,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        explanation: result.explanation
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return fuzzyMatch(userAnswer, correctAnswer);
    }
  } catch (error) {
    console.error("AI answer checking failed:", error);
    return fuzzyMatch(userAnswer, correctAnswer);
  }
}
async function checkAnswer(userAnswer, correctAnswer, question, hint, useAI = true) {
  const fuzzyResult = fuzzyMatch(userAnswer, correctAnswer);
  if (fuzzyResult.isCorrect && fuzzyResult.confidence >= 0.9) {
    return fuzzyResult;
  }
  if (useAI && process.env.PERPLEXITY_API_KEY && fuzzyResult.confidence < 0.8) {
    const aiResult = await checkAnswerWithAI(userAnswer, correctAnswer, question, hint);
    if (aiResult.confidence > fuzzyResult.confidence || aiResult.isCorrect !== fuzzyResult.isCorrect) {
      return aiResult;
    }
  }
  return fuzzyResult;
}

// server/routes.ts
var submitRiddleSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(500, "Question cannot exceed 500 characters"),
  answer: z.string().min(1, "Answer is required").max(100, "Answer cannot exceed 100 characters"),
  explanation: z.string().optional().nullable(),
  hint: z.string().optional().nullable(),
  categoryId: z.number().int().positive("Category is required"),
  difficulty: z.enum(["easy", "medium", "hard", "extreme"]),
  imageUrl: z.string().url().optional().nullable(),
  creatorName: z.string().optional().nullable()
});
var createQuizTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required").max(100, "Topic name cannot exceed 100 characters"),
  description: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  colorTheme: z.string().default("blue"),
  iconEmoji: z.string().default("\u{1F9E0}"),
  isCustom: z.boolean().default(true)
});
var createQuizQuestionSchema = z.object({
  topicId: z.number().int().positive("Topic ID is required"),
  questionText: z.string().min(5, "Question must be at least 5 characters").max(500, "Question cannot exceed 500 characters"),
  questionType: z.enum(["multiple_choice", "true_false", "text_input"]).default("multiple_choice"),
  choices: z.string().optional().nullable(),
  // JSON array for multiple choice
  correctAnswer: z.string().min(1, "Correct answer is required").max(200, "Answer cannot exceed 200 characters"),
  explanation: z.string().optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  energyReward: z.number().int().min(5).max(50).default(15)
});
var validateAnswerSchema = z.object({
  questionId: z.number().int().positive("Question ID is required"),
  userAnswer: z.string().min(1, "Answer is required").max(200, "Answer cannot exceed 200 characters")
});
var createDungeonRunSchema = z.object({
  characterType: z.string().min(1, "Character type is required"),
  topicId: z.number().int().positive("Topic ID is required"),
  playerId: z.number().int().positive().optional()
});
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.post("/api/music/spotify-token", async (req, res) => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Spotify credentials not configured" });
      }
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
        },
        body: "grant_type=client_credentials"
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to get Spotify token" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Spotify token error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    const categories2 = await storage.getAllCategories();
    res.json(categories2);
  });
  app2.get("/api/riddles", async (req, res) => {
    const { categoryId } = req.query;
    let riddles2;
    if (categoryId && !isNaN(Number(categoryId))) {
      riddles2 = await storage.getRiddlesByCategory(Number(categoryId));
    } else {
      riddles2 = await storage.getAllRiddles();
    }
    res.json(riddles2);
  });
  app2.get("/api/riddles/with-categories", async (req, res) => {
    const riddlesWithCategories = await storage.getRiddlesWithCategories();
    res.json(riddlesWithCategories);
  });
  app2.get("/api/riddles/:id", async (req, res) => {
    const riddleId = Number(req.params.id);
    const riddle = await storage.getRiddleById(riddleId);
    if (!riddle) {
      return res.status(404).json({ message: "Riddle not found" });
    }
    res.json(riddle);
  });
  const checkAnswerSchema = z.object({
    riddleId: z.number(),
    answer: z.string(),
    timeToSolveSeconds: z.number().optional(),
    userId: z.number().default(1),
    // default to guest user
    hintsUsed: z.number().default(0),
    hasViewedAnswer: z.boolean().optional().default(false)
    // track if user has seen the answer
  });
  app2.post("/api/check-answer", async (req, res) => {
    try {
      const data = checkAnswerSchema.parse(req.body);
      const { riddleId, answer, userId, timeToSolveSeconds, hintsUsed, hasViewedAnswer } = data;
      const riddle = await storage.getRiddleById(riddleId);
      if (!riddle) {
        return res.status(404).json({ message: "Riddle not found" });
      }
      const existingProgress = await storage.getUserRiddleProgress(userId, riddleId);
      const alreadyViewedAnswer = hasViewedAnswer || existingProgress && existingProgress.hasViewedAnswer;
      console.log(`Comparing answers - User: "${answer}" vs Correct: "${riddle.answer}"`);
      const answerCheckResult = await checkAnswer(
        answer,
        riddle.answer,
        riddle.question,
        riddle.hint || void 0,
        true
        // Enable AI checking
      );
      const isCorrect = answerCheckResult.isCorrect;
      if (answerCheckResult.explanation) {
        console.log(`Answer check result: ${answerCheckResult.explanation} (Confidence: ${answerCheckResult.confidence})`);
      }
      let pointsEarned = 0;
      if (isCorrect && !alreadyViewedAnswer) {
        let basePoints = 0;
        if (riddle.difficulty === "easy") basePoints = 10;
        else if (riddle.difficulty === "medium") basePoints = 15;
        else if (riddle.difficulty === "hard") basePoints = 25;
        else if (riddle.difficulty === "extreme") basePoints = 40;
        const category = await storage.getCategoryById(riddle.categoryId);
        if (category) {
          const categoryName = category.name.toLowerCase();
          if (categoryName === "burble words" || categoryName.includes("burble")) {
            basePoints *= 2;
          } else if (categoryName === "ev special" || categoryName.includes("valentine")) {
            basePoints *= 3;
          } else if (categoryName === "emoji guess" || categoryName.includes("emoji")) {
            basePoints = Math.round(basePoints * 1.5);
          }
        }
        if (timeToSolveSeconds && timeToSolveSeconds < 60) {
          const speedBonus = Math.round(basePoints * (0.5 - timeToSolveSeconds / 120));
          basePoints += Math.max(0, speedBonus);
        }
        pointsEarned = Math.max(0, basePoints - hintsUsed * 5);
        await storage.updateUserScore(userId, pointsEarned);
      }
      await storage.createOrUpdateUserProgress({
        userId,
        riddleId,
        solved: isCorrect,
        timeToSolveSeconds: timeToSolveSeconds || 0,
        hintsUsed,
        hasViewedAnswer: alreadyViewedAnswer || isCorrect
        // Mark as viewed if they've seen it or just solved it
      });
      const userStats = await storage.getUserStats(userId);
      res.json({
        isCorrect,
        pointsEarned,
        explanation: isCorrect ? riddle.explanation : null,
        answer: isCorrect ? riddle.answer : null,
        userStats
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/mark-viewed", async (req, res) => {
    try {
      const { riddleId, userId } = req.body;
      if (!riddleId || !userId) {
        return res.status(400).json({ message: "Missing riddleId or userId" });
      }
      await storage.createOrUpdateUserProgress({
        userId: Number(userId),
        riddleId: Number(riddleId),
        solved: false,
        // Don't mark as solved unless they actually solved it
        hasViewedAnswer: true,
        timeToSolveSeconds: 0,
        hintsUsed: 0
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking riddle as viewed:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/hints/:riddleId", async (req, res) => {
    const riddleId = Number(req.params.riddleId);
    const { userId = 1 } = req.query;
    const riddle = await storage.getRiddleById(riddleId);
    if (!riddle) {
      return res.status(404).json({ message: "Riddle not found" });
    }
    await storage.updateUserScore(Number(userId), -5);
    const progress = await storage.getUserRiddleProgress(Number(userId), riddleId);
    if (progress) {
      await storage.createOrUpdateUserProgress({
        ...progress,
        hintsUsed: (progress.hintsUsed || 0) + 1
      });
    } else {
      await storage.createOrUpdateUserProgress({
        userId: Number(userId),
        riddleId,
        solved: false,
        hintsUsed: 1
      });
    }
    const userStats = await storage.getUserStats(Number(userId));
    res.json({
      hint: riddle.hint || "No hint available for this riddle.",
      pointsDeducted: 5,
      userStats
    });
  });
  app2.get("/api/quiz/topics", async (req, res) => {
    try {
      const topics = await storage.getAllQuizTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching quiz topics:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/quiz/topics/:id", async (req, res) => {
    try {
      const topicId = Number(req.params.id);
      const topic = await storage.getQuizTopicById(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Quiz topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching quiz topic:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/quiz/topics/:id/questions", async (req, res) => {
    try {
      const topicId = Number(req.params.id);
      const { difficulty, limit } = req.query;
      const questions = await storage.getQuestionsByTopic(
        topicId,
        difficulty,
        limit ? Number(limit) : 10
      );
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/quiz/topics", async (req, res) => {
    try {
      const validatedData = createQuizTopicSchema.parse(req.body);
      const userId = req.user?.id || null;
      const topic = await storage.createQuizTopic({
        ...validatedData,
        createdBy: userId
      });
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating quiz topic:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/quiz/questions", async (req, res) => {
    try {
      const validatedData = createQuizQuestionSchema.parse(req.body);
      const userId = req.user?.id || null;
      const question = await storage.createQuizQuestion({
        ...validatedData,
        createdBy: userId
      });
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/quiz/validate-answer", async (req, res) => {
    try {
      const validatedData = validateAnswerSchema.parse(req.body);
      const result = await storage.validateQuizAnswer(
        validatedData.questionId,
        validatedData.userAnswer
      );
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error validating quiz answer:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/dungeon/start", async (req, res) => {
    try {
      const validatedData = createDungeonRunSchema.parse(req.body);
      const existingRun = await storage.getActiveDungeonRun(validatedData.playerId);
      if (existingRun) {
        return res.json({ dungeonRun: existingRun, message: "Resumed existing dungeon run" });
      }
      const dungeonRun = await storage.createDungeonRun(validatedData);
      res.status(201).json({ dungeonRun, message: "Dungeon run started" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error starting dungeon run:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/dungeon/active", async (req, res) => {
    try {
      const { playerId } = req.query;
      const dungeonRun = await storage.getActiveDungeonRun(
        playerId ? Number(playerId) : void 0
      );
      if (!dungeonRun) {
        return res.status(404).json({ message: "No active dungeon run found" });
      }
      res.json(dungeonRun);
    } catch (error) {
      console.error("Error fetching active dungeon run:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/dungeon/:id", async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const updates = req.body;
      const updatedRun = await storage.updateDungeonRun(dungeonId, updates);
      res.json(updatedRun);
    } catch (error) {
      console.error("Error updating dungeon run:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/dungeon/:id/question", async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: "Active dungeon run not found" });
      }
      const questions = await storage.getQuestionsByTopic(dungeon.topicId, "medium", 1);
      if (questions.length === 0) {
        return res.status(404).json({ message: "No questions available for this topic" });
      }
      res.json(questions[0]);
    } catch (error) {
      console.error("Error getting dungeon question:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/dungeon/:id/answer", async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const { questionId, answer } = req.body;
      if (!questionId || !answer) {
        return res.status(400).json({ message: "Question ID and answer are required" });
      }
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: "Active dungeon run not found" });
      }
      const result = await storage.validateQuizAnswer(questionId, answer);
      let enemyDefeated = false;
      let playerDefeated = false;
      let xpGained = 0;
      if (result.isCorrect) {
        const damageDealt = 25 + result.energyReward;
        const newEnemyHp = Math.max(0, dungeon.enemyHp - damageDealt);
        if (newEnemyHp === 0) {
          enemyDefeated = true;
          xpGained = 50;
          if (dungeon.activeBurblemonId) {
            await storage.gainBurblemonXP(dungeon.activeBurblemonId, xpGained);
          }
          await storage.updateDungeonRun(dungeonId, {
            enemyHp: dungeon.enemyMaxHp,
            enemyMaxHp: dungeon.enemyMaxHp,
            currentEnemyType: Math.random() > 0.8 ? "boss" : "grunt",
            // 20% chance for boss
            correctAnswers: dungeon.correctAnswers + 1,
            questionsAnswered: dungeon.questionsAnswered + 1,
            enemiesDefeated: dungeon.enemiesDefeated + 1
          });
        } else {
          await storage.updateDungeonRun(dungeonId, {
            enemyHp: newEnemyHp,
            correctAnswers: dungeon.correctAnswers + 1,
            questionsAnswered: dungeon.questionsAnswered + 1
          });
        }
      } else {
        const damageDealt = 15;
        const newPlayerHp = Math.max(0, dungeon.playerHp - damageDealt);
        if (newPlayerHp === 0) {
          playerDefeated = true;
          await storage.updateDungeonRun(dungeonId, {
            playerHp: 0,
            isActive: false,
            questionsAnswered: dungeon.questionsAnswered + 1,
            completedAt: /* @__PURE__ */ new Date()
          });
        } else {
          await storage.updateDungeonRun(dungeonId, {
            playerHp: newPlayerHp,
            questionsAnswered: dungeon.questionsAnswered + 1
          });
        }
      }
      res.json({
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        energyReward: result.energyReward,
        enemyDefeated,
        playerDefeated,
        xpGained
      });
    } catch (error) {
      console.error("Error submitting dungeon answer:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/dungeon/:id/explore", async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: "Active dungeon run not found" });
      }
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const allItems = await storage.getAllItems();
      const explorationItems = allItems.filter(
        (item) => item.itemType === "healing" || item.itemType === "utility" || item.itemType === "treasure"
      );
      if (explorationItems.length === 0) {
        return res.status(404).json({ message: "No exploration items available" });
      }
      const lootCount = Math.floor(Math.random() * 3) + 1;
      const foundItems = [];
      for (let i = 0; i < lootCount; i++) {
        const randomItem = explorationItems[Math.floor(Math.random() * explorationItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        await storage.addItemToInventory(req.session.userId, randomItem.id, quantity);
        foundItems.push({
          ...randomItem,
          quantityFound: quantity
        });
      }
      await storage.updateDungeonRun(dungeonId, {
        isActive: false,
        completedAt: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        message: "Exploration successful!",
        itemsFound: foundItems,
        totalItems: lootCount
      });
    } catch (error) {
      console.error("Error during dungeon exploration:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/burblemons/species", async (req, res) => {
    try {
      const species = await storage.getAllBurblemonSpecies();
      res.json(species);
    } catch (error) {
      console.error("Error fetching Burblemon species:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/burblemons/species/:id", async (req, res) => {
    try {
      const speciesId = Number(req.params.id);
      const species = await storage.getBurblemonSpeciesById(speciesId);
      if (!species) {
        return res.status(404).json({ message: "Burblemon species not found" });
      }
      res.json(species);
    } catch (error) {
      console.error("Error fetching Burblemon species:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/burblemons/species", async (req, res) => {
    try {
      const species = await storage.createBurblemonSpecies(req.body);
      res.status(201).json(species);
    } catch (error) {
      console.error("Error creating Burblemon species:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/burblemons/player/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const burblemons = await storage.getPlayerBurblemons(userId);
      res.json(burblemons);
    } catch (error) {
      console.error("Error fetching player Burblemons:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/burblemons/player/:userId/starters", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const starters = await storage.getPlayerStarterBurblemons(userId);
      res.json(starters);
    } catch (error) {
      console.error("Error fetching starter Burblemons:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/burblemons/:id", async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const burblemon = await storage.getPlayerBurblemonById(burblemonId);
      if (!burblemon) {
        return res.status(404).json({ message: "Player Burblemon not found" });
      }
      res.json(burblemon);
    } catch (error) {
      console.error("Error fetching player Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/burblemons", async (req, res) => {
    try {
      const burblemon = await storage.createPlayerBurblemon(req.body);
      res.status(201).json(burblemon);
    } catch (error) {
      console.error("Error creating player Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/burblemons/:id", async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const updates = req.body;
      const updatedBurblemon = await storage.updatePlayerBurblemon(burblemonId, updates);
      res.json(updatedBurblemon);
    } catch (error) {
      console.error("Error updating player Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/burblemons/:id/level-up", async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const leveledUpBurblemon = await storage.levelUpBurblemon(burblemonId);
      res.json(leveledUpBurblemon);
    } catch (error) {
      console.error("Error leveling up Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/burblemons/:id/evolve", async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const { newSpeciesId } = req.body;
      const evolvedBurblemon = await storage.evolveBurblemon(burblemonId, newSpeciesId);
      res.json(evolvedBurblemon);
    } catch (error) {
      console.error("Error evolving Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/burblemons/:id/heal", async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const healedBurblemon = await storage.healBurblemon(burblemonId);
      res.json(healedBurblemon);
    } catch (error) {
      console.error("Error healing Burblemon:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/map/zones", async (req, res) => {
    try {
      const zones = await storage.getAllMapZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching map zones:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/map/zones/:id", async (req, res) => {
    try {
      const zoneId = Number(req.params.id);
      const zone = await storage.getMapZoneById(zoneId);
      if (!zone) {
        return res.status(404).json({ message: "Map zone not found" });
      }
      res.json(zone);
    } catch (error) {
      console.error("Error fetching map zone:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/map/zones", async (req, res) => {
    try {
      const zone = await storage.createMapZone(req.body);
      res.status(201).json(zone);
    } catch (error) {
      console.error("Error creating map zone:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/map/paths", async (req, res) => {
    try {
      const { fromZoneId } = req.query;
      const paths = await storage.getZonePaths(fromZoneId ? Number(fromZoneId) : void 0);
      res.json(paths);
    } catch (error) {
      console.error("Error fetching zone paths:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/map/paths", async (req, res) => {
    try {
      const path3 = await storage.createZonePath(req.body);
      res.status(201).json(path3);
    } catch (error) {
      console.error("Error creating zone path:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/map/progress/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const progress = await storage.getPlayerMapProgress(userId);
      if (!progress) {
        return res.status(404).json({ message: "Player map progress not found" });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error fetching player map progress:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/map/progress", async (req, res) => {
    try {
      const progress = await storage.createOrUpdatePlayerMapProgress(req.body);
      res.json(progress);
    } catch (error) {
      console.error("Error updating player map progress:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/map/unlock-zone", async (req, res) => {
    try {
      const { userId, zoneId } = req.body;
      await storage.unlockZoneForPlayer(userId, zoneId);
      res.json({ success: true, message: "Zone unlocked successfully" });
    } catch (error) {
      console.error("Error unlocking zone:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/wild/encounters/:zoneId", async (req, res) => {
    try {
      const zoneId = Number(req.params.zoneId);
      const encounters = await storage.getWildEncountersByZone(zoneId);
      res.json(encounters);
    } catch (error) {
      console.error("Error fetching wild encounters:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/wild/encounters", async (req, res) => {
    try {
      const encounter = await storage.createWildEncounter(req.body);
      res.status(201).json(encounter);
    } catch (error) {
      console.error("Error creating wild encounter:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/wild/random/:zoneId", async (req, res) => {
    try {
      const zoneId = Number(req.params.zoneId);
      const randomEncounter = await storage.generateRandomWildEncounter(zoneId);
      if (!randomEncounter) {
        return res.status(404).json({ message: "No wild encounters available in this zone" });
      }
      res.json(randomEncounter);
    } catch (error) {
      console.error("Error generating random encounter:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/items", async (req, res) => {
    try {
      const { type } = req.query;
      let items2;
      if (type) {
        items2 = await storage.getItemsByType(type);
      } else {
        items2 = await storage.getAllItems();
      }
      res.json(items2);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/items/:id", async (req, res) => {
    try {
      const itemId = Number(req.params.id);
      const item = await storage.getItemById(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/items", async (req, res) => {
    try {
      const item = await storage.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/inventory/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const inventory = await storage.getPlayerInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching player inventory:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/inventory/add", async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const inventoryItem = await storage.addItemToInventory(userId, itemId, quantity);
      res.json(inventoryItem);
    } catch (error) {
      console.error("Error adding item to inventory:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/inventory/remove", async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const success = await storage.removeItemFromInventory(userId, itemId, quantity);
      res.json({ success });
    } catch (error) {
      console.error("Error removing item from inventory:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/inventory/use", async (req, res) => {
    try {
      const { userId, itemId, targetBurblemonId } = req.body;
      const result = await storage.useItem(userId, itemId, targetBurblemonId);
      res.json(result);
    } catch (error) {
      console.error("Error using item:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/economy/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const economy = await storage.getPlayerEconomy(userId);
      if (!economy) {
        return res.status(404).json({ message: "Player economy not found" });
      }
      res.json(economy);
    } catch (error) {
      console.error("Error fetching player economy:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/economy/update-money", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const economy = await storage.updatePlayerMoney(userId, amount);
      res.json(economy);
    } catch (error) {
      console.error("Error updating player money:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/economy/purchase", async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const result = await storage.processPurchase(userId, itemId, quantity);
      res.json(result);
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/battles/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const records = await storage.getBattleRecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching battle records:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/battles", async (req, res) => {
    try {
      const record = await storage.createBattleRecord(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating battle record:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/battles/:userId/stats", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const stats = await storage.getPlayerBattleStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching battle stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/user/:userId/stats", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(404).json({ message: "User not found" });
    }
  });
  app2.get("/api/user/:userId/progress", async (req, res) => {
    const userId = Number(req.params.userId);
    const progress = await storage.getUserProgress(userId);
    res.json(progress);
  });
  app2.get("/api/user/:userId/favorites", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!req.isAuthenticated() && req.user?.id !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/user/:userId/favorites/toggle/:riddleId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const riddleId = Number(req.params.riddleId);
      if (!req.isAuthenticated() || req.user?.id !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await storage.toggleUserFavorite(userId, riddleId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite status" });
    }
  });
  app2.get("/api/user/:userId/favorites/check/:riddleId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const riddleId = Number(req.params.riddleId);
      const isFavorited = await storage.isRiddleFavorited(userId, riddleId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });
  app2.get("/api/user/avatar", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let avatarConfig = {};
      try {
        avatarConfig = JSON.parse(user.avatarConfig || "{}");
      } catch (error) {
        console.error("Failed to parse avatar config:", error);
        avatarConfig = {};
      }
      res.json({ avatarConfig });
    } catch (error) {
      console.error("Error getting avatar config:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/user/avatar", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { avatarConfig } = req.body;
      if (!avatarConfig || typeof avatarConfig !== "object") {
        return res.status(400).json({ message: "Invalid avatar configuration" });
      }
      const updatedUser = await storage.updateUser(req.session.userId, {
        avatarConfig: JSON.stringify(avatarConfig)
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        success: true,
        message: "Avatar updated successfully",
        avatarConfig
      });
    } catch (error) {
      console.error("Error updating avatar config:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/profile-pictures/upload", async (req, res) => {
    const userId = req.user?.id || req.session.passport?.user;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { ObjectStorageService: ObjectStorageService2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const objectStorageService = new ObjectStorageService2();
      const uploadURL = await objectStorageService.getProfileImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });
  app2.put("/api/user/profile-picture", async (req, res) => {
    const userId = req.user?.id || req.session.passport?.user;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { imageUrl } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageUrl || null
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        success: true,
        message: "Profile picture updated successfully",
        profileImageUrl: imageUrl
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/profile-images/:imageId(*)", async (req, res) => {
    try {
      const { ObjectStorageService: ObjectStorageService2, ObjectNotFoundError: ObjectNotFoundError2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const objectStorageService = new ObjectStorageService2();
      const objectFile = await objectStorageService.getProfileImageFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving profile image:", error);
      if (error instanceof (await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports))).ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/admin/remove-inappropriate-users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const offensivePatterns = ["shit", "fuck", "ass", "dick", "pussy", "bitch"];
      for (const pattern of offensivePatterns) {
        await storage.removeUsersByEmail(pattern);
      }
      return res.status(200).json({
        message: "Inappropriate users removed successfully",
        patternsChecked: offensivePatterns
      });
    } catch (error) {
      console.error("Error removing inappropriate users:", error);
      res.status(500).json({ message: "Failed to remove inappropriate users" });
    }
  });
  app2.get("/api/leaderboard", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const filteredUsers = users2.filter((user) => {
        if (user.solvedCount <= 0) return false;
        if (user.email && (user.email.toLowerCase().includes("shit") || user.email.toLowerCase().includes("fuck") || user.email.toLowerCase().includes("ass") || user.email.toLowerCase().includes("dick") || user.email.toLowerCase().includes("pussy") || user.email.toLowerCase().includes("bitch"))) {
          return false;
        }
        return true;
      });
      const sortedUsers = filteredUsers.sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        if (a.avgTimeSeconds !== b.avgTimeSeconds) {
          return a.avgTimeSeconds - b.avgTimeSeconds;
        }
        return b.score - a.score;
      });
      res.json(sortedUsers.slice(0, 20));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
  app2.post("/api/ai/hint", getAIHint);
  app2.post("/api/ai/generate-riddle", getNewRiddle);
  const saveRiddleSchema = z.object({
    question: z.string(),
    answer: z.string(),
    explanation: z.string().nullable().default(null),
    hint: z.string().nullable().default(null),
    categoryId: z.number(),
    difficulty: z.string().default("medium")
  });
  app2.post("/api/ai/save-riddle", async (req, res) => {
    try {
      const data = saveRiddleSchema.parse(req.body);
      const newRiddle = await storage.createRiddle({
        ...data,
        // Set default avgSolveTimeSeconds as null since no one has solved it yet
        avgSolveTimeSeconds: null
      });
      res.json({
        success: true,
        riddle: newRiddle
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid riddle data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error saving riddle" });
    }
  });
  app2.post("/api/riddles/submit", async (req, res) => {
    try {
      const data = submitRiddleSchema.parse(req.body);
      const { userId = 1 } = req.query;
      const fanMadeCategory = await storage.getCategoryByName("Fan Made");
      const fanMadeCategoryId = fanMadeCategory?.id || data.categoryId;
      const newRiddle = await storage.createRiddle({
        ...data,
        // If creatorName is not provided, use "Anonymous"
        creatorName: data.creatorName || "Anonymous",
        // Always mark user-submitted riddles as fan-made
        isFanMade: true,
        // Use the Fan Made category if available
        categoryId: fanMadeCategoryId,
        avgSolveTimeSeconds: null
      });
      await storage.updateUserScore(Number(userId), 10);
      res.json({
        success: true,
        message: "Riddle submitted successfully! You earned 10 points.",
        riddle: newRiddle
      });
    } catch (error) {
      console.error("Riddle submission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid riddle submission",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error while submitting riddle"
      });
    }
  });
  const triviaCompleteSchema = z.object({
    userId: z.number(),
    score: z.number(),
    correctAnswers: z.number(),
    totalQuestions: z.number(),
    timeToComplete: z.number().optional()
  });
  app2.post("/api/trivia/complete", async (req, res) => {
    try {
      const data = triviaCompleteSchema.parse(req.body);
      const { userId, score, correctAnswers, totalQuestions, timeToComplete } = data;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newTriviaCount = (user.triviaCount || 0) + 1;
      const newScore = user.score + score;
      await storage.updateUserScore(userId, score);
      const updatedUser = {
        ...user,
        triviaCount: newTriviaCount,
        score: newScore
      };
      await storage.updateUser(userId, { triviaCount: newTriviaCount });
      res.json({
        success: true,
        message: `Trivia completed! You earned ${score} points.`,
        stats: {
          triviaCount: newTriviaCount,
          score: newScore,
          correctAnswers,
          totalQuestions
        }
      });
    } catch (error) {
      console.error("Trivia completion error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trivia completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error processing trivia completion" });
    }
  });
  app2.post("/api/animal-trivia/complete", async (req, res) => {
    try {
      const data = triviaCompleteSchema.parse(req.body);
      const { userId, score, correctAnswers, totalQuestions, timeToComplete } = data;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newAnimalTriviaCount = (user.animalTriviaCount || 0) + 1;
      const newScore = user.score + score;
      await storage.updateUserScore(userId, score);
      await storage.updateUser(userId, { animalTriviaCount: newAnimalTriviaCount });
      res.json({
        success: true,
        message: `Animal trivia completed! You earned ${score} points.`,
        stats: {
          animalTriviaCount: newAnimalTriviaCount,
          score: newScore,
          correctAnswers,
          totalQuestions
        }
      });
    } catch (error) {
      console.error("Animal trivia completion error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid animal trivia completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error processing animal trivia completion" });
    }
  });
  app2.get("/api/dictionary/validate/:word", async (req, res) => {
    try {
      const word = req.params.word;
      if (!word || word.length < 2) {
        return res.json({ isValid: false, reason: "Word is too short" });
      }
      const isValid = await dictionaryService.isRealWord(word);
      res.json({
        isValid,
        reason: isValid ? null : "Word not found in dictionary"
      });
    } catch (error) {
      console.error("Error validating word:", error);
      res.json({ isValid: true, reason: null });
    }
  });
  app2.post("/api/multiplayer/create-session", async (req, res) => {
    try {
      const { hostUserId, categoryId, difficulty, maxPlayers, timePerQuestion, withBot } = req.body;
      const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const riddles2 = await storage.getRandomRiddlesByCategory(categoryId, 10);
      const riddleIds = JSON.stringify(riddles2.map((r) => r.id));
      const session3 = await storage.createGameSession({
        sessionCode,
        hostUserId,
        riddleIds,
        categoryId,
        difficulty,
        maxPlayers: maxPlayers || 2,
        timePerQuestion: timePerQuestion || 45
      });
      await storage.joinGameSession(session3.id, hostUserId);
      if (withBot) {
        await storage.addBotToSession(session3.id, hostUserId);
      }
      const sessionWithParticipants = await storage.getGameSessionWithParticipants(session3.id);
      res.json({ success: true, session: sessionWithParticipants });
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ success: false, message: "Failed to create game session" });
    }
  });
  app2.post("/api/multiplayer/join-session", async (req, res) => {
    try {
      const { sessionCode, userId } = req.body;
      const session3 = await storage.getGameSessionByCode(sessionCode);
      if (!session3) {
        return res.status(404).json({ success: false, message: "Game session not found" });
      }
      if (session3.status !== "waiting") {
        return res.status(400).json({ success: false, message: "Game has already started" });
      }
      const participant = await storage.joinGameSession(session3.id, userId);
      const updatedSession = await storage.getGameSessionWithParticipants(session3.id);
      res.json({ success: true, session: updatedSession, participant });
    } catch (error) {
      console.error("Error joining game session:", error);
      res.status(500).json({ success: false, message: "Failed to join game session" });
    }
  });
  app2.get("/api/multiplayer/session/:sessionId", async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const session3 = await storage.getGameSessionWithParticipants(sessionId);
      if (!session3) {
        return res.status(404).json({ success: false, message: "Game session not found" });
      }
      res.json({ success: true, session: session3 });
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ success: false, message: "Failed to fetch game session" });
    }
  });
  app2.get("/api/geography/maps", async (req, res) => {
    try {
      const maps = await storage.getAllGeoMaps();
      res.json(maps);
    } catch (error) {
      console.error("Error fetching geography maps:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/geography/maps/:key", async (req, res) => {
    try {
      const mapKey = req.params.key;
      const mapWithRegions = await storage.getGeoMapByKey(mapKey);
      if (!mapWithRegions) {
        return res.status(404).json({ message: "Geography map not found" });
      }
      res.json(mapWithRegions);
    } catch (error) {
      console.error("Error fetching geography map:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/geography/submit", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { mapId, answers, timeSpent, hintsUsed } = req.body;
      const map = await storage.getGeoMapById(mapId);
      if (!map) {
        return res.status(404).json({ message: "Map not found" });
      }
      const regions = await storage.getGeoRegionsByMap(mapId);
      const totalQuestions = regions.length;
      let correctAnswers = 0;
      let streakBonus = 0;
      let currentStreak = 0;
      for (const region of regions) {
        const userAnswer = answers[region.code]?.toLowerCase().trim() || "";
        const correctAnswers_arr = [
          region.name.toLowerCase(),
          region.fullName?.toLowerCase(),
          region.capital?.toLowerCase()
        ].filter(Boolean);
        const isCorrect = correctAnswers_arr.some(
          (correct) => userAnswer.includes(correct) || correct.includes(userAnswer)
        );
        if (isCorrect) {
          correctAnswers++;
          currentStreak++;
          if (currentStreak % 5 === 0) {
            streakBonus += 25;
          }
        } else {
          currentStreak = 0;
        }
      }
      const baseScore = correctAnswers * 10;
      const timeBonus = Math.max(0, Math.floor((3600 - Math.min(timeSpent || 0, 3600)) / 72));
      const hintPenalty = (hintsUsed || 0) * 5;
      const totalScore = Math.max(0, baseScore + streakBonus + timeBonus - hintPenalty);
      const maxScore = totalQuestions * 10 + 50;
      const result = await storage.submitGeoGameResult({
        userId,
        mapId,
        score: totalScore,
        maxScore,
        correctAnswers,
        totalQuestions,
        timeSpent,
        streakBonus,
        hintsUsed: hintsUsed || 0
      });
      res.json({
        result,
        breakdown: {
          baseScore,
          streakBonus,
          timeBonus,
          hintPenalty,
          totalScore,
          percentage: Math.round(correctAnswers / totalQuestions * 100)
        }
      });
    } catch (error) {
      console.error("Error submitting geography game result:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/geography/leaderboard/:mapId", async (req, res) => {
    try {
      const mapId = Number(req.params.mapId);
      const limit = Number(req.query.limit) || 10;
      const leaderboard = await storage.getGeoLeaderboard(mapId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching geography leaderboard:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/geography/scores/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const mapId = req.query.mapId ? Number(req.query.mapId) : void 0;
      const scores = await storage.getPlayerGeoHighScores(userId, mapId);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching player geography scores:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const connections = /* @__PURE__ */ new Map();
  const sessionConnections = /* @__PURE__ */ new Map();
  wss.on("connection", (ws2) => {
    let userId = null;
    let sessionId = null;
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "join":
            userId = message.userId;
            sessionId = message.sessionId;
            connections.set(userId, ws2);
            if (!sessionConnections.has(sessionId)) {
              sessionConnections.set(sessionId, /* @__PURE__ */ new Set());
            }
            sessionConnections.get(sessionId).add(ws2);
            broadcastToSession(sessionId, {
              type: "user-joined",
              userId,
              timestamp: Date.now()
            });
            break;
          case "ready":
            if (sessionId && userId) {
              await storage.markPlayerReady(sessionId, userId);
              const session3 = await storage.getGameSessionWithParticipants(sessionId);
              const allReady = session3.participants.every((p) => p.isReady);
              broadcastToSession(sessionId, {
                type: "player-ready",
                userId,
                allReady,
                session: session3,
                timestamp: Date.now()
              });
              if (allReady && session3.participants.length >= 2) {
                await storage.startGameSession(sessionId);
                const riddleIds = JSON.parse(session3.riddleIds);
                const firstRiddle = await storage.getRiddleById(riddleIds[0]);
                broadcastToSession(sessionId, {
                  type: "game-started",
                  currentQuestion: firstRiddle,
                  questionIndex: 0,
                  timePerQuestion: session3.timePerQuestion,
                  timestamp: Date.now()
                });
              }
            }
            break;
          case "start-game":
            if (sessionId && userId) {
              console.log(`Received start-game message from user ${userId} for session ${sessionId}`);
              const session3 = await storage.getGameSessionWithParticipants(sessionId);
              if (session3.hostUserId === userId) {
                console.log("User is host, checking game start conditions...");
                const allReady = session3.participants.every((p) => p.isReady);
                console.log(`All players ready: ${allReady}, participant count: ${session3.participants.length}`);
                console.log("Participants:", session3.participants.map((p) => ({ id: p.userId, ready: p.isReady, sprite: p.spriteType })));
                if (allReady && session3.participants.length >= 2) {
                  console.log("Starting game session...");
                  await storage.startGameSession(sessionId);
                  const riddleIds = JSON.parse(session3.riddleIds);
                  const firstRiddle = await storage.getRiddleById(riddleIds[0]);
                  console.log("Broadcasting game-started message...");
                  broadcastToSession(sessionId, {
                    type: "game-started",
                    currentQuestion: firstRiddle,
                    questionIndex: 0,
                    timePerQuestion: session3.timePerQuestion,
                    timestamp: Date.now()
                  });
                } else {
                  console.log("Cannot start game - conditions not met");
                  ws2.send(JSON.stringify({
                    type: "error",
                    message: "Not all players are ready or minimum players not met",
                    timestamp: Date.now()
                  }));
                }
              } else {
                console.log("User is not the host, ignoring start-game message");
              }
            }
            break;
          case "submit-answer":
            if (sessionId && userId) {
              const { answer, timeToAnswerSeconds, questionIndex } = message;
              const session3 = await storage.getGameSessionWithParticipants(sessionId);
              const riddleIds = JSON.parse(session3.riddleIds);
              const currentRiddleId = riddleIds[questionIndex];
              const riddle = await storage.getRiddleById(currentRiddleId);
              const isTimeout = !answer || answer.trim() === "";
              let isCorrect = false;
              if (!isTimeout) {
                const answerResult = await checkAnswer(answer, riddle.answer);
                isCorrect = answerResult.isCorrect;
              }
              await storage.saveGameAnswer({
                sessionId,
                userId,
                riddleId: currentRiddleId,
                questionIndex,
                answer: answer || "",
                isCorrect,
                timeToAnswerSeconds
              });
              const currentParticipant = session3.participants.find((p) => p.userId === userId);
              let battleEffects = null;
              if (currentParticipant) {
                const spriteInfo = storage.getSpriteInfo(currentParticipant.spriteType || "balanced");
                if (isCorrect) {
                  const timeBonus = Math.max(0, session3.timePerQuestion - timeToAnswerSeconds);
                  const points = 100 + Math.floor(timeBonus * 2);
                  await storage.updateParticipantScore(sessionId, userId, points);
                  if (spriteInfo.correctBonus > 0) {
                    await storage.updateParticipantEnergy(sessionId, userId, spriteInfo.correctBonus);
                    battleEffects = {
                      type: "energy_gain",
                      playerId: userId,
                      playerName: currentParticipant.user.username,
                      amount: spriteInfo.correctBonus,
                      reason: "Correct Answer Bonus"
                    };
                  }
                } else {
                  const hpPenalty = isTimeout ? 10 : spriteInfo.incorrectPenalty;
                  await storage.updateParticipantHP(sessionId, userId, currentParticipant.hp - hpPenalty);
                  battleEffects = {
                    type: "hp_loss",
                    playerId: userId,
                    playerName: currentParticipant.user.username,
                    amount: hpPenalty,
                    reason: isTimeout ? "Time Ran Out" : "Wrong Answer"
                  };
                }
              }
              broadcastToSession(sessionId, {
                type: "answer-submitted",
                userId,
                isCorrect,
                userAnswer: answer,
                correctAnswer: !isCorrect ? riddle.answer : void 0,
                questionIndex,
                battleEffects,
                timestamp: Date.now()
              });
              const answers = await storage.getQuestionAnswers(sessionId, questionIndex);
              const allAnswered = answers.length >= session3.participants.length;
              if (allAnswered) {
                const allAnswersWithEffects = await Promise.all(
                  answers.map(async (answer2) => {
                    const participant = session3.participants.find((p) => p.userId === answer2.userId);
                    if (!participant) return null;
                    const spriteInfo = storage.getSpriteInfo(participant.spriteType || "balanced");
                    const isTimeout2 = !answer2.answer || answer2.answer.trim() === "";
                    if (answer2.isCorrect && spriteInfo.correctBonus > 0) {
                      return {
                        type: "energy_gain",
                        playerId: answer2.userId,
                        playerName: participant.user.username,
                        amount: spriteInfo.correctBonus,
                        reason: "Correct Answer Bonus"
                      };
                    } else if (!answer2.isCorrect) {
                      const hpPenalty = isTimeout2 ? 10 : spriteInfo.incorrectPenalty;
                      return {
                        type: "hp_loss",
                        playerId: answer2.userId,
                        playerName: participant.user.username,
                        amount: hpPenalty,
                        reason: isTimeout2 ? "Time Ran Out" : "Wrong Answer"
                      };
                    }
                    return null;
                  })
                );
                const battleMoves = allAnswersWithEffects.filter((effect) => effect !== null);
                if (battleMoves.length > 0) {
                  broadcastToSession(sessionId, {
                    type: "battle-moves",
                    moves: battleMoves,
                    questionIndex,
                    timestamp: Date.now()
                  });
                }
                setTimeout(() => {
                  const nextQuestionIndex = questionIndex + 1;
                  if (nextQuestionIndex < riddleIds.length) {
                    storage.getRiddleById(riddleIds[nextQuestionIndex]).then((nextRiddle) => {
                      storage.updateGameQuestionIndex(sessionId, nextQuestionIndex);
                      broadcastToSession(sessionId, {
                        type: "next-question",
                        currentQuestion: nextRiddle,
                        questionIndex: nextQuestionIndex,
                        correctAnswer: riddle.answer,
                        timestamp: Date.now()
                      });
                    });
                  } else {
                    storage.finishGameSession(sessionId).then(() => {
                      storage.getGameSessionWithParticipants(sessionId).then((finalSession) => {
                        const leaderboard = finalSession.participants.sort((a, b) => b.score - a.score).map((p, index) => ({
                          position: index + 1,
                          userId: p.userId,
                          username: p.user.username,
                          score: p.score,
                          correctAnswers: p.correctAnswers,
                          totalAnswered: p.totalAnswered
                        }));
                        broadcastToSession(sessionId, {
                          type: "game-finished",
                          leaderboard,
                          correctAnswer: riddle.answer,
                          timestamp: Date.now()
                        });
                      });
                    });
                  }
                }, 1e3);
              }
            }
            break;
          case "battle-action":
            if (sessionId && userId) {
              const { action } = message;
              console.log(`Received battle action from user ${userId}:`, { sessionId, action });
              try {
                const session3 = await storage.getGameSessionWithParticipants(sessionId);
                if (!session3) {
                  ws2.send(JSON.stringify({
                    type: "error",
                    message: "Session not found"
                  }));
                  break;
                }
                await storage.updateParticipantBattleAction(sessionId, userId, action);
                let energyCost = 0;
                switch (action) {
                  case "attack":
                    energyCost = 5;
                    break;
                  case "shield":
                    energyCost = 3;
                    break;
                  case "reflect":
                    energyCost = 5;
                    break;
                  case "charge":
                    energyCost = 2;
                    break;
                }
                if (energyCost > 0) {
                  await storage.updateParticipantEnergy(sessionId, userId, -energyCost);
                }
                if (action === "shield") {
                  await storage.updateParticipantShield(sessionId, userId, true);
                } else if (action === "reflect") {
                  await storage.updateParticipantShield(sessionId, userId, true);
                } else if (action === "charge") {
                  const currentParticipant = session3.participants.find((p) => p.userId === userId);
                  if (currentParticipant) {
                    await storage.updateParticipantCharge(sessionId, userId, currentParticipant.chargePower + 5);
                  }
                } else if (action === "attack") {
                  const target = session3.participants.find((p) => p.userId !== userId);
                  if (target) {
                    const targetParticipant = session3.participants.find((p) => p.userId === target.userId);
                    const targetSpriteInfo = storage.getSpriteInfo(targetParticipant?.spriteType || "balanced");
                    const targetHasReflect = targetSpriteInfo.hasReflect && targetParticipant?.hasShield;
                    if (targetHasReflect) {
                      const attacker = session3.participants.find((p) => p.userId === userId);
                      const damage = 10 + (attacker?.chargePower || 0);
                      const newAttackerHP = Math.max(0, (attacker?.hp || 50) - damage);
                      await storage.updateParticipantHP(sessionId, userId, newAttackerHP);
                      await storage.updateParticipantShield(sessionId, target.userId, false);
                      await storage.updateParticipantCharge(sessionId, userId, 0);
                      broadcastToSession(sessionId, {
                        type: "battle-result",
                        attackerId: userId,
                        targetId: target.userId,
                        action: "reflect",
                        damage,
                        reflected: true,
                        attackerHP: newAttackerHP,
                        targetHP: target.hp,
                        timestamp: Date.now()
                      });
                    } else {
                      const battleResult = await storage.processBattleAction(sessionId, userId, target.userId, "attack", 10);
                      broadcastToSession(sessionId, {
                        type: "battle-result",
                        attackerId: userId,
                        targetId: target.userId,
                        action,
                        damage: battleResult.damage,
                        shieldBroken: battleResult.shieldBroken,
                        targetHP: battleResult.targetHP,
                        timestamp: Date.now()
                      });
                    }
                    break;
                  }
                }
                ws2.send(JSON.stringify({
                  type: "battle-action-confirmed",
                  action,
                  timestamp: Date.now()
                }));
                broadcastToSession(sessionId, {
                  type: "participant-action",
                  userId,
                  action,
                  timestamp: Date.now()
                });
              } catch (error) {
                console.error("Error processing battle action:", error);
                ws2.send(JSON.stringify({
                  type: "error",
                  message: "Failed to process battle action"
                }));
              }
            }
            break;
          case "select-sprite":
            if (sessionId && userId) {
              const { spriteType } = message;
              console.log(`Received sprite selection from user ${userId}:`, { sessionId, spriteType });
              try {
                await storage.updateParticipantSprite(sessionId, userId, spriteType);
                broadcastToSession(sessionId, {
                  type: "sprite-selected",
                  userId,
                  spriteType,
                  timestamp: Date.now()
                });
              } catch (error) {
                console.error("Error processing sprite selection:", error);
                ws2.send(JSON.stringify({
                  type: "error",
                  message: "Failed to select sprite"
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws2.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });
    ws2.on("close", () => {
      if (userId) {
        connections.delete(userId);
      }
      if (sessionId && sessionConnections.has(sessionId)) {
        sessionConnections.get(sessionId).delete(ws2);
        if (sessionConnections.get(sessionId).size === 0) {
          sessionConnections.delete(sessionId);
        }
        if (userId) {
          broadcastToSession(sessionId, {
            type: "user-left",
            userId,
            timestamp: Date.now()
          });
        }
      }
    });
  });
  function broadcastToSession(sessionId, message) {
    const sessionWs = sessionConnections.get(sessionId);
    if (sessionWs) {
      const messageStr = JSON.stringify(message);
      sessionWs.forEach((ws2) => {
        if (ws2.readyState === WebSocket.OPEN) {
          ws2.send(messageStr);
        }
      });
    }
  }
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

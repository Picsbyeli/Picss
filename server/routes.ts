import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { getAIHint, getNewRiddle } from "./ai-service";
import { setupAuth } from "./auth";
import { dictionaryService } from "./dictionary-service";
import { checkAnswer } from "./ai-answer-checker";

// Validation schema for riddle submissions
const submitRiddleSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(500, "Question cannot exceed 500 characters"),
  answer: z.string().min(1, "Answer is required").max(100, "Answer cannot exceed 100 characters"),
  explanation: z.string().optional().nullable(),
  hint: z.string().optional().nullable(),
  categoryId: z.number().int().positive("Category is required"),
  difficulty: z.enum(["easy", "medium", "hard", "extreme"]),
  imageUrl: z.string().url().optional().nullable(),
  creatorName: z.string().optional().nullable(),
});

// Validation schemas for quiz operations
const createQuizTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required").max(100, "Topic name cannot exceed 100 characters"),
  description: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  colorTheme: z.string().default("blue"),
  iconEmoji: z.string().default("🧠"),
  isCustom: z.boolean().default(true)
});

const createQuizQuestionSchema = z.object({
  topicId: z.number().int().positive("Topic ID is required"),
  questionText: z.string().min(5, "Question must be at least 5 characters").max(500, "Question cannot exceed 500 characters"),
  questionType: z.enum(["multiple_choice", "true_false", "text_input"]).default("multiple_choice"),
  choices: z.string().optional().nullable(), // JSON array for multiple choice
  correctAnswer: z.string().min(1, "Correct answer is required").max(200, "Answer cannot exceed 200 characters"),
  explanation: z.string().optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  energyReward: z.number().int().min(5).max(50).default(15)
});

const validateAnswerSchema = z.object({
  questionId: z.number().int().positive("Question ID is required"),
  userAnswer: z.string().min(1, "Answer is required").max(200, "Answer cannot exceed 200 characters")
});

const createDungeonRunSchema = z.object({
  characterType: z.string().min(1, "Character type is required"),
  topicId: z.number().int().positive("Topic ID is required"),
  playerId: z.number().int().positive().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);

  // Music API routes - secure backend proxy
  app.post('/api/music/spotify-token', async (req, res) => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Spotify credentials not configured' });
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to get Spotify token' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Spotify token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Categories
  app.get('/api/categories', async (req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });
  
  // Riddles
  app.get('/api/riddles', async (req, res) => {
    const { categoryId } = req.query;
    
    let riddles;
    if (categoryId && !isNaN(Number(categoryId as string))) {
      riddles = await storage.getRiddlesByCategory(Number(categoryId));
    } else {
      riddles = await storage.getAllRiddles();
    }
    
    res.json(riddles);
  });
  
  app.get('/api/riddles/with-categories', async (req, res) => {
    const riddlesWithCategories = await storage.getRiddlesWithCategories();
    res.json(riddlesWithCategories);
  });
  
  app.get('/api/riddles/:id', async (req, res) => {
    const riddleId = Number(req.params.id);
    const riddle = await storage.getRiddleById(riddleId);
    
    if (!riddle) {
      return res.status(404).json({ message: 'Riddle not found' });
    }
    
    res.json(riddle);
  });
  
  // Check answer
  const checkAnswerSchema = z.object({
    riddleId: z.number(),
    answer: z.string(),
    timeToSolveSeconds: z.number().optional(),
    userId: z.number().default(1), // default to guest user
    hintsUsed: z.number().default(0),
    hasViewedAnswer: z.boolean().optional().default(false) // track if user has seen the answer
  });
  
  app.post('/api/check-answer', async (req, res) => {
    try {
      const data = checkAnswerSchema.parse(req.body);
      const { riddleId, answer, userId, timeToSolveSeconds, hintsUsed, hasViewedAnswer } = data;
      
      const riddle = await storage.getRiddleById(riddleId);
      if (!riddle) {
        return res.status(404).json({ message: 'Riddle not found' });
      }
      
      // Check if the user has already viewed the answer - if so, they shouldn't earn points
      // Get the existing progress to check if they've already seen the answer
      const existingProgress = await storage.getUserRiddleProgress(userId, riddleId);
      const alreadyViewedAnswer = hasViewedAnswer || (existingProgress && existingProgress.hasViewedAnswer);
      
      // Use AI-powered answer checking with fuzzy matching fallback
      console.log(`Comparing answers - User: "${answer}" vs Correct: "${riddle.answer}"`);
      
      const answerCheckResult = await checkAnswer(
        answer,
        riddle.answer,
        riddle.question,
        riddle.hint || undefined,
        true // Enable AI checking
      );
      
      const isCorrect = answerCheckResult.isCorrect;
      
      // Log the result for debugging
      if (answerCheckResult.explanation) {
        console.log(`Answer check result: ${answerCheckResult.explanation} (Confidence: ${answerCheckResult.confidence})`);
      }
      
      // Calculate points based on difficulty and hints used
      let pointsEarned = 0;
      if (isCorrect && !alreadyViewedAnswer) {
        // Only award points if they haven't viewed the answer
        
        // Base points by difficulty
        let basePoints = 0;
        if (riddle.difficulty === 'easy') basePoints = 10;
        else if (riddle.difficulty === 'medium') basePoints = 15;
        else if (riddle.difficulty === 'hard') basePoints = 25;
        else if (riddle.difficulty === 'extreme') basePoints = 40;
        
        // Get category for special game types
        const category = await storage.getCategoryById(riddle.categoryId);
        
        // Award more points for special game types
        if (category) {
          const categoryName = category.name.toLowerCase();
          // Premium games get extra points
          if (categoryName === 'burble words' || categoryName.includes('burble')) {
            // Burble gives 2x points
            basePoints *= 2;
          } else if (categoryName === 'ev special' || categoryName.includes('valentine')) {
            // Are You My Valentine gives 3x points
            basePoints *= 3;
          } else if (categoryName === 'emoji guess' || categoryName.includes('emoji')) {
            // Emoji Guess gives 1.5x points
            basePoints = Math.round(basePoints * 1.5);
          }
        }
        
        // Bonus for quick solving (if solved in less than 60 seconds)
        if (timeToSolveSeconds && timeToSolveSeconds < 60) {
          // Add up to 50% bonus for very fast solves
          const speedBonus = Math.round(basePoints * (0.5 - (timeToSolveSeconds / 120)));
          basePoints += Math.max(0, speedBonus);
        }
        
        // Subtract points for hints (5 per hint)
        pointsEarned = Math.max(0, basePoints - (hintsUsed * 5));
        
        // Update user score
        await storage.updateUserScore(userId, pointsEarned);
      }
      
      // Update user progress
      await storage.createOrUpdateUserProgress({
        userId,
        riddleId,
        solved: isCorrect,
        timeToSolveSeconds: timeToSolveSeconds || 0,
        hintsUsed,
        hasViewedAnswer: alreadyViewedAnswer || isCorrect // Mark as viewed if they've seen it or just solved it
      });
      
      // Get user stats
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
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Mark a riddle as viewed (when user sees the answer)
  app.post('/api/mark-viewed', async (req, res) => {
    try {
      const { riddleId, userId } = req.body;
      
      if (!riddleId || !userId) {
        return res.status(400).json({ message: 'Missing riddleId or userId' });
      }
      
      // Update the user progress to indicate they've viewed this answer
      await storage.createOrUpdateUserProgress({
        userId: Number(userId),
        riddleId: Number(riddleId),
        solved: false, // Don't mark as solved unless they actually solved it
        hasViewedAnswer: true,
        timeToSolveSeconds: 0,
        hintsUsed: 0
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking riddle as viewed:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get hint
  app.get('/api/hints/:riddleId', async (req, res) => {
    const riddleId = Number(req.params.riddleId);
    const { userId = 1 } = req.query; // Default to guest user if not provided
    
    const riddle = await storage.getRiddleById(riddleId);
    if (!riddle) {
      return res.status(404).json({ message: 'Riddle not found' });
    }
    
    // Deduct 5 points for using a hint
    await storage.updateUserScore(Number(userId), -5);
    
    // Update user progress to record hint usage
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
    
    // Get updated user stats
    const userStats = await storage.getUserStats(Number(userId));
    
    res.json({
      hint: riddle.hint || "No hint available for this riddle.",
      pointsDeducted: 5,
      userStats
    });
  });

  // Quiz Topic routes for solo dungeon
  app.get('/api/quiz/topics', async (req, res) => {
    try {
      const topics = await storage.getAllQuizTopics();
      res.json(topics);
    } catch (error) {
      console.error('Error fetching quiz topics:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/quiz/topics/:id', async (req, res) => {
    try {
      const topicId = Number(req.params.id);
      const topic = await storage.getQuizTopicById(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: 'Quiz topic not found' });
      }
      
      res.json(topic);
    } catch (error) {
      console.error('Error fetching quiz topic:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/quiz/topics/:id/questions', async (req, res) => {
    try {
      const topicId = Number(req.params.id);
      const { difficulty, limit } = req.query;
      
      const questions = await storage.getQuestionsByTopic(
        topicId, 
        difficulty as string,
        limit ? Number(limit) : 10
      );
      
      res.json(questions);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/quiz/topics', async (req, res) => {
    try {
      const validatedData = createQuizTopicSchema.parse(req.body);
      const userId = (req as any).user?.id || null; // Get user ID from session if available
      
      const topic = await storage.createQuizTopic({
        ...validatedData,
        createdBy: userId
      });
      
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Error creating quiz topic:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/quiz/questions', async (req, res) => {
    try {
      const validatedData = createQuizQuestionSchema.parse(req.body);
      const userId = (req as any).user?.id || null; // Get user ID from session if available
      
      const question = await storage.createQuizQuestion({
        ...validatedData,
        createdBy: userId
      });
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Error creating quiz question:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/quiz/validate-answer', async (req, res) => {
    try {
      const validatedData = validateAnswerSchema.parse(req.body);
      
      const result = await storage.validateQuizAnswer(
        validatedData.questionId,
        validatedData.userAnswer
      );
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Error validating quiz answer:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Dungeon run routes
  app.post('/api/dungeon/start', async (req, res) => {
    try {
      const validatedData = createDungeonRunSchema.parse(req.body);
      
      // Check if there's already an active dungeon run for this player
      const existingRun = await storage.getActiveDungeonRun(validatedData.playerId);
      if (existingRun) {
        return res.json({ dungeonRun: existingRun, message: 'Resumed existing dungeon run' });
      }
      
      const dungeonRun = await storage.createDungeonRun(validatedData);
      res.status(201).json({ dungeonRun, message: 'Dungeon run started' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      console.error('Error starting dungeon run:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/dungeon/active', async (req, res) => {
    try {
      const { playerId } = req.query;
      const dungeonRun = await storage.getActiveDungeonRun(
        playerId ? Number(playerId) : undefined
      );
      
      if (!dungeonRun) {
        return res.status(404).json({ message: 'No active dungeon run found' });
      }
      
      res.json(dungeonRun);
    } catch (error) {
      console.error('Error fetching active dungeon run:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/dungeon/:id', async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const updates = req.body;
      
      const updatedRun = await storage.updateDungeonRun(dungeonId, updates);
      res.json(updatedRun);
    } catch (error) {
      console.error('Error updating dungeon run:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get next question for dungeon
  app.get('/api/dungeon/:id/question', async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      
      // Get the current dungeon run
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: 'Active dungeon run not found' });
      }
      
      // Get a random question from the dungeon's topic
      const questions = await storage.getQuestionsByTopic(dungeon.topicId, 'medium', 1);
      if (questions.length === 0) {
        return res.status(404).json({ message: 'No questions available for this topic' });
      }
      
      res.json(questions[0]);
    } catch (error) {
      console.error('Error getting dungeon question:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Submit answer to dungeon question
  app.post('/api/dungeon/:id/answer', async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      const { questionId, answer } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ message: 'Question ID and answer are required' });
      }
      
      // Get the current dungeon run
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: 'Active dungeon run not found' });
      }
      
      // Validate the answer
      const result = await storage.validateQuizAnswer(questionId, answer);
      
      let enemyDefeated = false;
      let playerDefeated = false;
      let xpGained = 0;
      
      // Update dungeon state based on answer
      if (result.isCorrect) {
        // Player deals damage to enemy
        const damageDealt = 25 + result.energyReward; // Base damage + energy bonus
        const newEnemyHp = Math.max(0, dungeon.enemyHp - damageDealt);
        
        // Check if enemy is defeated
        if (newEnemyHp === 0) {
          enemyDefeated = true;
          xpGained = 50; // Base XP for defeating an enemy
          
          // Award XP to active Burblemon
          if (dungeon.activeBurblemonId) {
            await storage.gainBurblemonXP(dungeon.activeBurblemonId, xpGained);
          }
          
          // Reset enemy for next battle or increase enemy count
          await storage.updateDungeonRun(dungeonId, {
            enemyHp: dungeon.enemyMaxHp,
            enemyMaxHp: dungeon.enemyMaxHp,
            currentEnemyType: Math.random() > 0.8 ? 'boss' : 'grunt', // 20% chance for boss
            correctAnswers: dungeon.correctAnswers + 1,
            questionsAnswered: dungeon.questionsAnswered + 1,
            enemiesDefeated: dungeon.enemiesDefeated + 1,
          });
        } else {
          // Update dungeon with reduced enemy HP
          await storage.updateDungeonRun(dungeonId, {
            enemyHp: newEnemyHp,
            correctAnswers: dungeon.correctAnswers + 1,
            questionsAnswered: dungeon.questionsAnswered + 1,
          });
        }
      } else {
        // Enemy deals damage to player
        const damageDealt = 15;
        const newPlayerHp = Math.max(0, dungeon.playerHp - damageDealt);
        
        // Check if player is defeated
        if (newPlayerHp === 0) {
          playerDefeated = true;
          await storage.updateDungeonRun(dungeonId, {
            playerHp: 0,
            isActive: false,
            questionsAnswered: dungeon.questionsAnswered + 1,
            completedAt: new Date()
          });
        } else {
          // Update dungeon with reduced player HP
          await storage.updateDungeonRun(dungeonId, {
            playerHp: newPlayerHp,
            questionsAnswered: dungeon.questionsAnswered + 1,
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
      console.error('Error submitting dungeon answer:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Dungeon exploration endpoint
  app.post('/api/dungeon/:id/explore', async (req, res) => {
    try {
      const dungeonId = Number(req.params.id);
      
      // Get the current dungeon run
      const dungeon = await storage.getDungeonRun(dungeonId);
      if (!dungeon || !dungeon.isActive) {
        return res.status(404).json({ message: 'Active dungeon run not found' });
      }
      
      // Get player from session
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get exploration items based on dungeon progress
      const allItems = await storage.getAllItems();
      const explorationItems = allItems.filter(item => 
        item.itemType === 'healing' || 
        item.itemType === 'utility' || 
        item.itemType === 'treasure'
      );
      
      if (explorationItems.length === 0) {
        return res.status(404).json({ message: 'No exploration items available' });
      }
      
      // Generate random loot (1-3 items)
      const lootCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const foundItems = [];
      
      for (let i = 0; i < lootCount; i++) {
        const randomItem = explorationItems[Math.floor(Math.random() * explorationItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        
        // Add item to player inventory
        await storage.addItemToInventory(req.session.userId, randomItem.id, quantity);
        
        foundItems.push({
          ...randomItem,
          quantityFound: quantity
        });
      }
      
      // Mark dungeon as completed since player chose to explore
      await storage.updateDungeonRun(dungeonId, {
        isActive: false,
        completedAt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Exploration successful!',
        itemsFound: foundItems,
        totalItems: lootCount
      });
      
    } catch (error) {
      console.error('Error during dungeon exploration:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Burblemon Species Routes
  app.get('/api/burblemons/species', async (req, res) => {
    try {
      const species = await storage.getAllBurblemonSpecies();
      res.json(species);
    } catch (error) {
      console.error('Error fetching Burblemon species:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/burblemons/species/:id', async (req, res) => {
    try {
      const speciesId = Number(req.params.id);
      const species = await storage.getBurblemonSpeciesById(speciesId);
      
      if (!species) {
        return res.status(404).json({ message: 'Burblemon species not found' });
      }
      
      res.json(species);
    } catch (error) {
      console.error('Error fetching Burblemon species:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/burblemons/species', async (req, res) => {
    try {
      const species = await storage.createBurblemonSpecies(req.body);
      res.status(201).json(species);
    } catch (error) {
      console.error('Error creating Burblemon species:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Player Burblemon Routes
  app.get('/api/burblemons/player/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const burblemons = await storage.getPlayerBurblemons(userId);
      res.json(burblemons);
    } catch (error) {
      console.error('Error fetching player Burblemons:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/burblemons/player/:userId/starters', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const starters = await storage.getPlayerStarterBurblemons(userId);
      res.json(starters);
    } catch (error) {
      console.error('Error fetching starter Burblemons:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/burblemons/:id', async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const burblemon = await storage.getPlayerBurblemonById(burblemonId);
      
      if (!burblemon) {
        return res.status(404).json({ message: 'Player Burblemon not found' });
      }
      
      res.json(burblemon);
    } catch (error) {
      console.error('Error fetching player Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/burblemons', async (req, res) => {
    try {
      const burblemon = await storage.createPlayerBurblemon(req.body);
      res.status(201).json(burblemon);
    } catch (error) {
      console.error('Error creating player Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/burblemons/:id', async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const updates = req.body;
      const updatedBurblemon = await storage.updatePlayerBurblemon(burblemonId, updates);
      res.json(updatedBurblemon);
    } catch (error) {
      console.error('Error updating player Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/burblemons/:id/level-up', async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const leveledUpBurblemon = await storage.levelUpBurblemon(burblemonId);
      res.json(leveledUpBurblemon);
    } catch (error) {
      console.error('Error leveling up Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/burblemons/:id/evolve', async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const { newSpeciesId } = req.body;
      const evolvedBurblemon = await storage.evolveBurblemon(burblemonId, newSpeciesId);
      res.json(evolvedBurblemon);
    } catch (error) {
      console.error('Error evolving Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/burblemons/:id/heal', async (req, res) => {
    try {
      const burblemonId = Number(req.params.id);
      const healedBurblemon = await storage.healBurblemon(burblemonId);
      res.json(healedBurblemon);
    } catch (error) {
      console.error('Error healing Burblemon:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Map Zones Routes
  app.get('/api/map/zones', async (req, res) => {
    try {
      const zones = await storage.getAllMapZones();
      res.json(zones);
    } catch (error) {
      console.error('Error fetching map zones:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/map/zones/:id', async (req, res) => {
    try {
      const zoneId = Number(req.params.id);
      const zone = await storage.getMapZoneById(zoneId);
      
      if (!zone) {
        return res.status(404).json({ message: 'Map zone not found' });
      }
      
      res.json(zone);
    } catch (error) {
      console.error('Error fetching map zone:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/map/zones', async (req, res) => {
    try {
      const zone = await storage.createMapZone(req.body);
      res.status(201).json(zone);
    } catch (error) {
      console.error('Error creating map zone:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/map/paths', async (req, res) => {
    try {
      const { fromZoneId } = req.query;
      const paths = await storage.getZonePaths(fromZoneId ? Number(fromZoneId) : undefined);
      res.json(paths);
    } catch (error) {
      console.error('Error fetching zone paths:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/map/paths', async (req, res) => {
    try {
      const path = await storage.createZonePath(req.body);
      res.status(201).json(path);
    } catch (error) {
      console.error('Error creating zone path:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Player Map Progress Routes
  app.get('/api/map/progress/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const progress = await storage.getPlayerMapProgress(userId);
      
      if (!progress) {
        return res.status(404).json({ message: 'Player map progress not found' });
      }
      
      res.json(progress);
    } catch (error) {
      console.error('Error fetching player map progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/map/progress', async (req, res) => {
    try {
      const progress = await storage.createOrUpdatePlayerMapProgress(req.body);
      res.json(progress);
    } catch (error) {
      console.error('Error updating player map progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/map/unlock-zone', async (req, res) => {
    try {
      const { userId, zoneId } = req.body;
      await storage.unlockZoneForPlayer(userId, zoneId);
      res.json({ success: true, message: 'Zone unlocked successfully' });
    } catch (error) {
      console.error('Error unlocking zone:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Wild Encounters Routes
  app.get('/api/wild/encounters/:zoneId', async (req, res) => {
    try {
      const zoneId = Number(req.params.zoneId);
      const encounters = await storage.getWildEncountersByZone(zoneId);
      res.json(encounters);
    } catch (error) {
      console.error('Error fetching wild encounters:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/wild/encounters', async (req, res) => {
    try {
      const encounter = await storage.createWildEncounter(req.body);
      res.status(201).json(encounter);
    } catch (error) {
      console.error('Error creating wild encounter:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/wild/random/:zoneId', async (req, res) => {
    try {
      const zoneId = Number(req.params.zoneId);
      const randomEncounter = await storage.generateRandomWildEncounter(zoneId);
      
      if (!randomEncounter) {
        return res.status(404).json({ message: 'No wild encounters available in this zone' });
      }
      
      res.json(randomEncounter);
    } catch (error) {
      console.error('Error generating random encounter:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Items Routes
  app.get('/api/items', async (req, res) => {
    try {
      const { type } = req.query;
      let items;
      
      if (type) {
        items = await storage.getItemsByType(type as string);
      } else {
        items = await storage.getAllItems();
      }
      
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/items/:id', async (req, res) => {
    try {
      const itemId = Number(req.params.id);
      const item = await storage.getItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/items', async (req, res) => {
    try {
      const item = await storage.createItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Inventory Routes
  app.get('/api/inventory/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const inventory = await storage.getPlayerInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching player inventory:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/inventory/add', async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const inventoryItem = await storage.addItemToInventory(userId, itemId, quantity);
      res.json(inventoryItem);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/inventory/remove', async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const success = await storage.removeItemFromInventory(userId, itemId, quantity);
      res.json({ success });
    } catch (error) {
      console.error('Error removing item from inventory:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/inventory/use', async (req, res) => {
    try {
      const { userId, itemId, targetBurblemonId } = req.body;
      const result = await storage.useItem(userId, itemId, targetBurblemonId);
      res.json(result);
    } catch (error) {
      console.error('Error using item:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Economy Routes
  app.get('/api/economy/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const economy = await storage.getPlayerEconomy(userId);
      
      if (!economy) {
        return res.status(404).json({ message: 'Player economy not found' });
      }
      
      res.json(economy);
    } catch (error) {
      console.error('Error fetching player economy:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/economy/update-money', async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const economy = await storage.updatePlayerMoney(userId, amount);
      res.json(economy);
    } catch (error) {
      console.error('Error updating player money:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/economy/purchase', async (req, res) => {
    try {
      const { userId, itemId, quantity } = req.body;
      const result = await storage.processPurchase(userId, itemId, quantity);
      res.json(result);
    } catch (error) {
      console.error('Error processing purchase:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Battle Records Routes
  app.get('/api/battles/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const records = await storage.getBattleRecords(userId);
      res.json(records);
    } catch (error) {
      console.error('Error fetching battle records:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/battles', async (req, res) => {
    try {
      const record = await storage.createBattleRecord(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error('Error creating battle record:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/battles/:userId/stats', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const stats = await storage.getPlayerBattleStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching battle stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // User stats
  app.get('/api/user/:userId/stats', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const stats = await storage.getUserStats(userId);
      
      res.json(stats);
    } catch (error) {
      res.status(404).json({ message: 'User not found' });
    }
  });
  
  // User progress
  app.get('/api/user/:userId/progress', async (req, res) => {
    const userId = Number(req.params.userId);
    const progress = await storage.getUserProgress(userId);
    
    res.json(progress);
  });
  
  // User favorites
  app.get('/api/user/:userId/favorites', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Make sure the user is authenticated or is requesting their own favorites
      if (!req.isAuthenticated() && req.user?.id !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: 'Failed to fetch favorites' });
    }
  });
  
  // Toggle favorite status
  app.post('/api/user/:userId/favorites/toggle/:riddleId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const riddleId = Number(req.params.riddleId);
      
      // Make sure the user is authenticated
      if (!req.isAuthenticated() || req.user?.id !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const result = await storage.toggleUserFavorite(userId, riddleId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: 'Failed to toggle favorite status' });
    }
  });
  
  // Check if riddle is favorited
  app.get('/api/user/:userId/favorites/check/:riddleId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const riddleId = Number(req.params.riddleId);
      
      // This endpoint doesn't need authentication as it just checks the status
      // and is used for rendering UI elements
      const isFavorited = await storage.isRiddleFavorited(userId, riddleId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: 'Failed to check favorite status' });
    }
  });

  // Avatar management routes
  app.get('/api/user/avatar', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Parse avatar config or return default
      let avatarConfig = {};
      try {
        avatarConfig = JSON.parse(user.avatarConfig || '{}');
      } catch (error) {
        console.error('Failed to parse avatar config:', error);
        avatarConfig = {};
      }

      res.json({ avatarConfig });
    } catch (error) {
      console.error('Error getting avatar config:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/user/avatar', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { avatarConfig } = req.body;
      
      if (!avatarConfig || typeof avatarConfig !== 'object') {
        return res.status(400).json({ message: 'Invalid avatar configuration' });
      }

      // Update user's avatar config
      const updatedUser = await storage.updateUser(req.session.userId, {
        avatarConfig: JSON.stringify(avatarConfig)
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        success: true, 
        message: 'Avatar updated successfully',
        avatarConfig
      });
    } catch (error) {
      console.error('Error updating avatar config:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Profile picture upload routes
  app.post('/api/profile-pictures/upload', async (req, res) => {
    const userId = req.user?.id || req.session.passport?.user;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfileImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ message: 'Failed to generate upload URL' });
    }
  });

  app.put('/api/user/profile-picture', async (req, res) => {
    const userId = req.user?.id || req.session.passport?.user;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { imageUrl } = req.body;
      
      // Update user's profile picture URL
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageUrl || null
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        success: true, 
        message: 'Profile picture updated successfully',
        profileImageUrl: imageUrl
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Serve profile images
  app.get('/profile-images/:imageId(*)', async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getProfileImageFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving profile image:", error);
      if (error instanceof (await import('./objectStorage.js')).ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  
  // Admin routes for moderation
  app.post('/api/admin/remove-inappropriate-users', async (req, res) => {
    try {
      // Only allow authenticated admin users (in a real app, you'd check admin role)
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Remove users with offensive/inappropriate email content
      const offensivePatterns = ['shit', 'fuck', 'ass', 'dick', 'pussy', 'bitch'];
      
      for (const pattern of offensivePatterns) {
        await storage.removeUsersByEmail(pattern);
      }
      
      return res.status(200).json({ 
        message: 'Inappropriate users removed successfully',
        patternsChecked: offensivePatterns
      });
    } catch (error) {
      console.error("Error removing inappropriate users:", error);
      res.status(500).json({ message: 'Failed to remove inappropriate users' });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      // Get all users with their stats
      const users = await storage.getAllUsers();
      
      // Filter out users with inappropriate usernames or emails
      const filteredUsers = users.filter(user => {
        // Filter out users who haven't solved any puzzles
        if (user.solvedCount <= 0) return false;
        
        // Filter out users with potentially offensive email addresses
        if (user.email && (
            user.email.toLowerCase().includes('shit') || 
            user.email.toLowerCase().includes('fuck') || 
            user.email.toLowerCase().includes('ass') ||
            user.email.toLowerCase().includes('dick') ||
            user.email.toLowerCase().includes('pussy') ||
            user.email.toLowerCase().includes('bitch'))) {
          return false;
        }
        
        return true;
      });
      
      // Sort the users by multiple criteria (in order of priority):
      // 1. Most puzzles solved (descending)
      // 2. Fastest average time (ascending)
      // 3. Highest score (descending)
      const sortedUsers = filteredUsers.sort((a, b) => {
        // First priority: Most solved puzzles
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        
        // Second priority: Fastest average time (lower is better)
        if (a.avgTimeSeconds !== b.avgTimeSeconds) {
          return a.avgTimeSeconds - b.avgTimeSeconds;
        }
        
        // Third priority: Highest score
        return b.score - a.score;
      });
      
      // Return the top 20 users (increased from 10 to give more visibility)
      res.json(sortedUsers.slice(0, 20));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  // AI Endpoints
  
  // Get AI-generated hint for a riddle
  app.post('/api/ai/hint', getAIHint);
  
  // Generate a new riddle using AI
  app.post('/api/ai/generate-riddle', getNewRiddle);
  
  // Save an AI-generated riddle to the database
  const saveRiddleSchema = z.object({
    question: z.string(),
    answer: z.string(),
    explanation: z.string().nullable().default(null),
    hint: z.string().nullable().default(null),
    categoryId: z.number(),
    difficulty: z.string().default('medium')
  });
  
  app.post('/api/ai/save-riddle', async (req, res) => {
    try {
      const data = saveRiddleSchema.parse(req.body);
      
      // Save the riddle to the database
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
        return res.status(400).json({ message: 'Invalid riddle data', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error saving riddle' });
    }
  });
  
  // User riddle submission endpoint
  app.post('/api/riddles/submit', async (req, res) => {
    try {
      const data = submitRiddleSchema.parse(req.body);
      const { userId = 1 } = req.query; // Default to guest user if not provided
      
      // Get the Fan Made category ID
      const fanMadeCategory = await storage.getCategoryByName("Fan Made");
      const fanMadeCategoryId = fanMadeCategory?.id || data.categoryId;
      
      // Save the user-submitted riddle, marking it as fan-made
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
      
      // Award points to the user for submitting a riddle
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
          message: 'Invalid riddle submission', 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false,
        message: 'Server error while submitting riddle' 
      });
    }
  });

  // Trivia Game Completion Endpoints

  // Schema for trivia game completion
  const triviaCompleteSchema = z.object({
    userId: z.number(),
    score: z.number(),
    correctAnswers: z.number(),
    totalQuestions: z.number(),
    timeToComplete: z.number().optional()
  });

  // Regular trivia completion endpoint
  app.post('/api/trivia/complete', async (req, res) => {
    try {
      const data = triviaCompleteSchema.parse(req.body);
      const { userId, score, correctAnswers, totalQuestions, timeToComplete } = data;

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's trivia count and score
      const newTriviaCount = (user.triviaCount || 0) + 1;
      const newScore = user.score + score;

      // Update user stats
      await storage.updateUserScore(userId, score);
      
      // Update trivia-specific stats
      const updatedUser = {
        ...user,
        triviaCount: newTriviaCount,
        score: newScore
      };

      // Update the user in storage
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
        return res.status(400).json({ message: 'Invalid trivia completion data', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error processing trivia completion' });
    }
  });

  // Animal trivia completion endpoint
  app.post('/api/animal-trivia/complete', async (req, res) => {
    try {
      const data = triviaCompleteSchema.parse(req.body);
      const { userId, score, correctAnswers, totalQuestions, timeToComplete } = data;

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's animal trivia count and score
      const newAnimalTriviaCount = (user.animalTriviaCount || 0) + 1;
      const newScore = user.score + score;

      // Update user stats
      await storage.updateUserScore(userId, score);
      
      // Update animal trivia-specific stats
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
        return res.status(400).json({ message: 'Invalid animal trivia completion data', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error processing animal trivia completion' });
    }
  });
  
  // Dictionary word validation for Burble game
  app.get('/api/dictionary/validate/:word', async (req, res) => {
    try {
      const word = req.params.word;
      if (!word || word.length < 2) {
        return res.json({ isValid: false, reason: 'Word is too short' });
      }
      
      const isValid = await dictionaryService.isRealWord(word);
      
      res.json({ 
        isValid,
        reason: isValid ? null : 'Word not found in dictionary'
      });
    } catch (error) {
      console.error('Error validating word:', error);
      // In case of error, we'll be lenient
      res.json({ isValid: true, reason: null });
    }
  });

  // Multiplayer game session routes
  app.post('/api/multiplayer/create-session', async (req, res) => {
    try {
      const { hostUserId, categoryId, difficulty, maxPlayers, timePerQuestion, withBot } = req.body;
      
      // Generate unique 6-digit session code
      const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Get random riddles for the game
      const riddles = await storage.getRandomRiddlesByCategory(categoryId, 10);
      const riddleIds = JSON.stringify(riddles.map(r => r.id));
      
      const session = await storage.createGameSession({
        sessionCode,
        hostUserId,
        riddleIds,
        categoryId,
        difficulty,
        maxPlayers: maxPlayers || 2,
        timePerQuestion: timePerQuestion || 45,
      });
      
      // Add host as participant
      await storage.joinGameSession(session.id, hostUserId);
      
      // If withBot is true, immediately add a bot (for bot battles only)
      if (withBot) {
        await storage.addBotToSession(session.id, hostUserId);
      }
      // For multiplayer games, do not automatically add bots - wait for real players to join
      
      // Always return session with participants so frontend knows about the bot
      const sessionWithParticipants = await storage.getGameSessionWithParticipants(session.id);
      res.json({ success: true, session: sessionWithParticipants });
    } catch (error) {
      console.error('Error creating game session:', error);
      res.status(500).json({ success: false, message: 'Failed to create game session' });
    }
  });

  app.post('/api/multiplayer/join-session', async (req, res) => {
    try {
      const { sessionCode, userId } = req.body;
      
      const session = await storage.getGameSessionByCode(sessionCode);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Game session not found' });
      }
      
      if (session.status !== 'waiting') {
        return res.status(400).json({ success: false, message: 'Game has already started' });
      }
      
      const participant = await storage.joinGameSession(session.id, userId);
      const updatedSession = await storage.getGameSessionWithParticipants(session.id);
      
      res.json({ success: true, session: updatedSession, participant });
    } catch (error) {
      console.error('Error joining game session:', error);
      res.status(500).json({ success: false, message: 'Failed to join game session' });
    }
  });

  app.get('/api/multiplayer/session/:sessionId', async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const session = await storage.getGameSessionWithParticipants(sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, message: 'Game session not found' });
      }
      
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error fetching game session:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch game session' });
    }
  });
  // Geography Game Routes
  app.get('/api/geography/maps', async (req, res) => {
    try {
      const maps = await storage.getAllGeoMaps();
      res.json(maps);
    } catch (error) {
      console.error('Error fetching geography maps:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/geography/maps/:key', async (req, res) => {
    try {
      const mapKey = req.params.key;
      const mapWithRegions = await storage.getGeoMapByKey(mapKey);
      
      if (!mapWithRegions) {
        return res.status(404).json({ message: 'Geography map not found' });
      }
      
      res.json(mapWithRegions);
    } catch (error) {
      console.error('Error fetching geography map:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/geography/submit', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { mapId, answers, timeSpent, hintsUsed } = req.body;
      
      // Validate the submission
      const map = await storage.getGeoMapById(mapId);
      if (!map) {
        return res.status(404).json({ message: 'Map not found' });
      }
      
      const regions = await storage.getGeoRegionsByMap(mapId);
      const totalQuestions = regions.length;
      let correctAnswers = 0;
      let streakBonus = 0;
      let currentStreak = 0;
      
      // Score calculation
      for (const region of regions) {
        const userAnswer = answers[region.code]?.toLowerCase().trim() || '';
        const correctAnswers_arr = [
          region.name.toLowerCase(),
          region.fullName?.toLowerCase(),
          region.capital?.toLowerCase()
        ].filter(Boolean);
        
        const isCorrect = correctAnswers_arr.some(correct => 
          userAnswer.includes(correct) || correct.includes(userAnswer)
        );
        
        if (isCorrect) {
          correctAnswers++;
          currentStreak++;
          
          // Streak bonus: +5 points for every 5 consecutive correct answers
          if (currentStreak % 5 === 0) {
            streakBonus += 25;
          }
        } else {
          currentStreak = 0;
        }
      }
      
      // Base score calculation
      const baseScore = correctAnswers * 10; // 10 points per correct answer
      
      // Time bonus (faster completion = more points, up to 50% bonus)
      const timeBonus = Math.max(0, Math.floor((3600 - Math.min(timeSpent || 0, 3600)) / 72)); // Up to 50 bonus points
      
      // Hint penalty (5 points lost per hint used)
      const hintPenalty = (hintsUsed || 0) * 5;
      
      const totalScore = Math.max(0, baseScore + streakBonus + timeBonus - hintPenalty);
      const maxScore = totalQuestions * 10 + 50; // Perfect score with max time bonus
      
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
          percentage: Math.round((correctAnswers / totalQuestions) * 100)
        }
      });
      
    } catch (error) {
      console.error('Error submitting geography game result:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/geography/leaderboard/:mapId', async (req, res) => {
    try {
      const mapId = Number(req.params.mapId);
      const limit = Number(req.query.limit) || 10;
      
      const leaderboard = await storage.getGeoLeaderboard(mapId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching geography leaderboard:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/geography/scores/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const mapId = req.query.mapId ? Number(req.query.mapId) : undefined;
      
      const scores = await storage.getPlayerGeoHighScores(userId, mapId);
      res.json(scores);
    } catch (error) {
      console.error('Error fetching player geography scores:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  const httpServer = createServer(app);
  
  // WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by user ID
  const connections = new Map<number, WebSocket>();
  const sessionConnections = new Map<number, Set<WebSocket>>();
  
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    let sessionId: number | null = null;
    
    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            userId = message.userId;
            sessionId = message.sessionId;
            connections.set(userId, ws);
            
            if (!sessionConnections.has(sessionId)) {
              sessionConnections.set(sessionId, new Set());
            }
            sessionConnections.get(sessionId)!.add(ws);
            
            // Broadcast user joined
            broadcastToSession(sessionId, {
              type: 'user-joined',
              userId,
              timestamp: Date.now()
            });
            break;
            
          case 'ready':
            if (sessionId && userId) {
              await storage.markPlayerReady(sessionId, userId);
              const session = await storage.getGameSessionWithParticipants(sessionId);
              
              // Check if all players are ready
              const allReady = session.participants.every(p => p.isReady);
              
              broadcastToSession(sessionId, {
                type: 'player-ready',
                userId,
                allReady,
                session,
                timestamp: Date.now()
              });
              
              // Start game if all players ready
              if (allReady && session.participants.length >= 2) {
                await storage.startGameSession(sessionId);
                const riddleIds = JSON.parse(session.riddleIds);
                const firstRiddle = await storage.getRiddleById(riddleIds[0]);
                
                broadcastToSession(sessionId, {
                  type: 'game-started',
                  currentQuestion: firstRiddle,
                  questionIndex: 0,
                  timePerQuestion: session.timePerQuestion,
                  timestamp: Date.now()
                });
              }
            }
            break;
            
          case 'start-game':
            if (sessionId && userId) {
              console.log(`Received start-game message from user ${userId} for session ${sessionId}`);
              const session = await storage.getGameSessionWithParticipants(sessionId);
              
              // Only allow the host to start the game
              if (session.hostUserId === userId) {
                console.log('User is host, checking game start conditions...');
                // Check if all players are ready
                const allReady = session.participants.every(p => p.isReady);
                console.log(`All players ready: ${allReady}, participant count: ${session.participants.length}`);
                console.log('Participants:', session.participants.map(p => ({ id: p.userId, ready: p.isReady, sprite: p.spriteType })));
                
                if (allReady && session.participants.length >= 2) {
                  console.log('Starting game session...');
                  await storage.startGameSession(sessionId);
                  const riddleIds = JSON.parse(session.riddleIds);
                  const firstRiddle = await storage.getRiddleById(riddleIds[0]);
                  
                  console.log('Broadcasting game-started message...');
                  broadcastToSession(sessionId, {
                    type: 'game-started',
                    currentQuestion: firstRiddle,
                    questionIndex: 0,
                    timePerQuestion: session.timePerQuestion,
                    timestamp: Date.now()
                  });
                } else {
                  console.log('Cannot start game - conditions not met');
                  // Send error message back to host
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not all players are ready or minimum players not met',
                    timestamp: Date.now()
                  }));
                }
              } else {
                console.log('User is not the host, ignoring start-game message');
              }
            }
            break;
            
          case 'submit-answer':
            if (sessionId && userId) {
              const { answer, timeToAnswerSeconds, questionIndex } = message;
              const session = await storage.getGameSessionWithParticipants(sessionId);
              const riddleIds = JSON.parse(session.riddleIds);
              const currentRiddleId = riddleIds[questionIndex];
              const riddle = await storage.getRiddleById(currentRiddleId);
              
              // Check if answer is correct (empty answer means timeout)
              const isTimeout = !answer || answer.trim() === '';
              let isCorrect = false;
              
              if (!isTimeout) {
                const answerResult = await checkAnswer(answer, riddle.answer);
                isCorrect = answerResult.isCorrect;
              }
              
              // Save answer
              await storage.saveGameAnswer({
                sessionId,
                userId,
                riddleId: currentRiddleId,
                questionIndex,
                answer: answer || '',
                isCorrect,
                timeToAnswerSeconds
              });
              
              // Handle scoring and HP changes with sprite abilities
              const currentParticipant = session.participants.find(p => p.userId === userId);
              let battleEffects = null;
              
              if (currentParticipant) {
                const spriteInfo = storage.getSpriteInfo(currentParticipant.spriteType || 'balanced');
                
                if (isCorrect) {
                  const timeBonus = Math.max(0, session.timePerQuestion - timeToAnswerSeconds);
                  const points = 100 + Math.floor(timeBonus * 2);
                  await storage.updateParticipantScore(sessionId, userId, points);
                  
                  // Apply sprite ability for correct answers
                  if (spriteInfo.correctBonus > 0) {
                    await storage.updateParticipantEnergy(sessionId, userId, spriteInfo.correctBonus);
                    battleEffects = {
                      type: 'energy_gain',
                      playerId: userId,
                      playerName: currentParticipant.user.username,
                      amount: spriteInfo.correctBonus,
                      reason: 'Correct Answer Bonus'
                    };
                  }
                } else {
                  // Wrong answer or timeout: apply HP penalty
                  const hpPenalty = isTimeout ? 10 : spriteInfo.incorrectPenalty; // Timeout penalty is 10 HP
                  await storage.updateParticipantHP(sessionId, userId, currentParticipant.hp - hpPenalty);
                  battleEffects = {
                    type: 'hp_loss',
                    playerId: userId,
                    playerName: currentParticipant.user.username,
                    amount: hpPenalty,
                    reason: isTimeout ? 'Time Ran Out' : 'Wrong Answer'
                  };
                }
              }
              
              // Broadcast answer submitted with correct answer when wrong
              broadcastToSession(sessionId, {
                type: 'answer-submitted',
                userId,
                isCorrect,
                userAnswer: answer,
                correctAnswer: !isCorrect ? riddle.answer : undefined,
                questionIndex,
                battleEffects,
                timestamp: Date.now()
              });
              
              // Check if all players answered
              const answers = await storage.getQuestionAnswers(sessionId, questionIndex);
              const allAnswered = answers.length >= session.participants.length;
              
              if (allAnswered) {
                // Collect all battle effects from this round
                const allAnswersWithEffects = await Promise.all(
                  answers.map(async (answer) => {
                    const participant = session.participants.find(p => p.userId === answer.userId);
                    if (!participant) return null;
                    
                    const spriteInfo = storage.getSpriteInfo(participant.spriteType || 'balanced');
                    const isTimeout = !answer.answer || answer.answer.trim() === '';
                    
                    if (answer.isCorrect && spriteInfo.correctBonus > 0) {
                      return {
                        type: 'energy_gain',
                        playerId: answer.userId,
                        playerName: participant.user.username,
                        amount: spriteInfo.correctBonus,
                        reason: 'Correct Answer Bonus'
                      };
                    } else if (!answer.isCorrect) {
                      const hpPenalty = isTimeout ? 10 : spriteInfo.incorrectPenalty;
                      return {
                        type: 'hp_loss',
                        playerId: answer.userId,
                        playerName: participant.user.username,
                        amount: hpPenalty,
                        reason: isTimeout ? 'Time Ran Out' : 'Wrong Answer'
                      };
                    }
                    return null;
                  })
                );
                
                const battleMoves = allAnswersWithEffects.filter(effect => effect !== null);
                
                // Send battle moves first if there are any
                if (battleMoves.length > 0) {
                  broadcastToSession(sessionId, {
                    type: 'battle-moves',
                    moves: battleMoves,
                    questionIndex,
                    timestamp: Date.now()
                  });
                }
                
                // Wait a bit for animations, then proceed
                setTimeout(() => {
                  // Move to next question or end game
                  const nextQuestionIndex = questionIndex + 1;
                  
                  if (nextQuestionIndex < riddleIds.length) {
                    storage.getRiddleById(riddleIds[nextQuestionIndex]).then(nextRiddle => {
                      storage.updateGameQuestionIndex(sessionId, nextQuestionIndex);
                      
                      broadcastToSession(sessionId, {
                        type: 'next-question',
                        currentQuestion: nextRiddle,
                        questionIndex: nextQuestionIndex,
                        correctAnswer: riddle.answer,
                        timestamp: Date.now()
                      });
                    });
                  } else {
                    // Game finished
                    storage.finishGameSession(sessionId).then(() => {
                      storage.getGameSessionWithParticipants(sessionId).then(finalSession => {
                        const leaderboard = finalSession.participants
                          .sort((a, b) => b.score - a.score)
                          .map((p, index) => ({
                            position: index + 1,
                            userId: p.userId,
                            username: p.user.username,
                            score: p.score,
                            correctAnswers: p.correctAnswers,
                            totalAnswered: p.totalAnswered
                          }));
                        
                        broadcastToSession(sessionId, {
                          type: 'game-finished',
                          leaderboard,
                          correctAnswer: riddle.answer,
                          timestamp: Date.now()
                        });
                      });
                    });
                  }
                }, 1000); // 1 second delay since individual moves are shown immediately
              }
            }
            break;

          case 'battle-action':
            if (sessionId && userId) {
              const { action } = message;
              console.log(`Received battle action from user ${userId}:`, { sessionId, action });
              
              try {
                // Get the current session
                const session = await storage.getGameSessionWithParticipants(sessionId);
                if (!session) {
                  ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Session not found' 
                  }));
                  break;
                }

                // Update participant's last action
                await storage.updateParticipantBattleAction(sessionId, userId, action);

                // Handle energy costs for actions
                let energyCost = 0;
                switch (action) {
                  case 'attack':
                    energyCost = 5;
                    break;
                  case 'shield':
                    energyCost = 3;
                    break;
                  case 'reflect':
                    energyCost = 5;
                    break;
                  case 'charge':
                    energyCost = 2;
                    break;
                }
                
                // Deduct energy for the action
                if (energyCost > 0) {
                  await storage.updateParticipantEnergy(sessionId, userId, -energyCost);
                }

                // Handle different battle actions
                if (action === 'shield') {
                  await storage.updateParticipantShield(sessionId, userId, true);
                } else if (action === 'reflect') {
                  // Reflect works like a shield but reflects damage back
                  await storage.updateParticipantShield(sessionId, userId, true);
                } else if (action === 'charge') {
                  const currentParticipant = session.participants.find(p => p.userId === userId);
                  if (currentParticipant) {
                    await storage.updateParticipantCharge(sessionId, userId, currentParticipant.chargePower + 5);
                  }
                } else if (action === 'attack') {
                  // Find target (other participant)
                  const target = session.participants.find(p => p.userId !== userId);
                  if (target) {
                    // Check if target has reflect shield
                    const targetParticipant = session.participants.find(p => p.userId === target.userId);
                    const targetSpriteInfo = storage.getSpriteInfo(targetParticipant?.spriteType || 'balanced');
                    const targetHasReflect = targetSpriteInfo.hasReflect && targetParticipant?.hasShield;
                    
                    if (targetHasReflect) {
                      // Reflect damage back to attacker
                      const attacker = session.participants.find(p => p.userId === userId);
                      const damage = 10 + (attacker?.chargePower || 0);
                      const newAttackerHP = Math.max(0, (attacker?.hp || 50) - damage);
                      
                      await storage.updateParticipantHP(sessionId, userId, newAttackerHP);
                      await storage.updateParticipantShield(sessionId, target.userId, false); // Remove reflect shield
                      await storage.updateParticipantCharge(sessionId, userId, 0); // Reset charge
                      
                      // Send reflected battle result
                      broadcastToSession(sessionId, {
                        type: 'battle-result',
                        attackerId: userId,
                        targetId: target.userId,
                        action: 'reflect',
                        damage: damage,
                        reflected: true,
                        attackerHP: newAttackerHP,
                        targetHP: target.hp,
                        timestamp: Date.now()
                      });
                    } else {
                      // Normal attack processing
                      const battleResult = await storage.processBattleAction(sessionId, userId, target.userId, 'attack', 10);
                      
                      // Send battle result to all participants
                      broadcastToSession(sessionId, {
                        type: 'battle-result',
                        attackerId: userId,
                        targetId: target.userId,
                        action,
                        damage: battleResult.damage,
                        shieldBroken: battleResult.shieldBroken,
                        targetHP: battleResult.targetHP,
                        timestamp: Date.now()
                      });
                    }
                    
                    break; // Don't send generic action response for attacks
                  }
                }

                // Send confirmation for non-attack actions
                ws.send(JSON.stringify({
                  type: 'battle-action-confirmed',
                  action,
                  timestamp: Date.now()
                }));

                // Broadcast action to other participants
                broadcastToSession(sessionId, {
                  type: 'participant-action',
                  userId,
                  action,
                  timestamp: Date.now()
                });

              } catch (error) {
                console.error('Error processing battle action:', error);
                ws.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Failed to process battle action' 
                }));
              }
            }
            break;

          case 'select-sprite':
            if (sessionId && userId) {
              const { spriteType } = message;
              console.log(`Received sprite selection from user ${userId}:`, { sessionId, spriteType });
              
              try {
                // Update participant's sprite
                await storage.updateParticipantSprite(sessionId, userId, spriteType);
                
                // Broadcast sprite selection to all participants
                broadcastToSession(sessionId, {
                  type: 'sprite-selected',
                  userId,
                  spriteType,
                  timestamp: Date.now()
                });

              } catch (error) {
                console.error('Error processing sprite selection:', error);
                ws.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Failed to select sprite' 
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        connections.delete(userId);
      }
      if (sessionId && sessionConnections.has(sessionId)) {
        sessionConnections.get(sessionId)!.delete(ws);
        if (sessionConnections.get(sessionId)!.size === 0) {
          sessionConnections.delete(sessionId);
        }
        
        // Broadcast user left
        if (userId) {
          broadcastToSession(sessionId, {
            type: 'user-left',
            userId,
            timestamp: Date.now()
          });
        }
      }
    });
  });
  
  function broadcastToSession(sessionId: number, message: any) {
    const sessionWs = sessionConnections.get(sessionId);
    if (sessionWs) {
      const messageStr = JSON.stringify(message);
      sessionWs.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }
  
  return httpServer;
}

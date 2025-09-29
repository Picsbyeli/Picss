/**
 * Burble Chrome Extension API
 * 
 * This file handles communication with the Burble web app API.
 * It includes fallback to mock data when the app is offline.
 */

import * as mockData from './mock-api.js';

// Base URL for the Burble web app API
const API_BASE_URL = 'https://burble-app.com/api';

// Cache connection status for faster responses
let isConnectedCache = null;
let connectedCacheTimestamp = 0;
const CACHE_TIMEOUT = 60000; // 1 minute cache timeout

/**
 * Check if the extension can connect to the web app API
 * Uses cached result if available and recent
 */
async function isConnectedToWebApp() {
  const now = Date.now();
  
  // Return cached result if available and recent
  if (isConnectedCache !== null && now - connectedCacheTimestamp < CACHE_TIMEOUT) {
    return isConnectedCache;
  }
  
  try {
    // Attempt to connect to the API
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Timeout after 3 seconds
      signal: AbortSignal.timeout(3000)
    });
    
    // Update cache
    isConnectedCache = response.ok;
    connectedCacheTimestamp = now;
    
    return response.ok;
  } catch (error) {
    console.log('Connection check failed:', error);
    
    // Update cache
    isConnectedCache = false;
    connectedCacheTimestamp = now;
    
    return false;
  }
}

/**
 * Fetch data from the Burble API with fallback to mock data
 */
async function fetchGameData(endpoint, params = {}) {
  try {
    // Check if we're connected to the web app
    const isConnected = await isConnectedToWebApp();
    if (!isConnected) {
      console.log(`Using mock data for ${endpoint} (offline)`);
      return simulateFetch(endpoint, params);
    }
    
    // Build query string from params
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    // Fetch from actual API
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    
    // Fall back to mock data
    console.log(`Using mock data for ${endpoint} (error fallback)`);
    return simulateFetch(endpoint, params);
  }
}

/**
 * Post data to the Burble API with fallback
 */
async function postGameData(endpoint, data = {}) {
  try {
    // Check if we're connected to the web app
    const isConnected = await isConnectedToWebApp();
    if (!isConnected) {
      console.log(`Using mock data for ${endpoint} (offline)`);
      return simulatePost(endpoint, data);
    }
    
    // Post to actual API
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    
    // Fall back to mock response
    console.log(`Using mock data for ${endpoint} (error fallback)`);
    return simulatePost(endpoint, data);
  }
}

/**
 * Simulate fetch from API using mock data
 */
function simulateFetch(endpoint, params) {
  // Add a small delay to simulate network request
  return new Promise(resolve => {
    setTimeout(() => {
      switch (endpoint) {
        case '/categories':
          resolve([...mockData.mockCategories]);
          break;
        
        case '/riddles/category':
          const categoryId = params.categoryId || null;
          let riddles = [...mockData.mockEmojiRiddles];
          
          // Filter by category if specified
          if (categoryId) {
            riddles = riddles.filter(r => r.categoryId === parseInt(categoryId));
          }
          
          resolve(riddles);
          break;
        
        case '/riddles/random':
          const difficulty = params.difficulty || 'medium';
          const catId = params.categoryId || null;
          
          // Filter by category and difficulty
          let eligibleRiddles = [...mockData.mockEmojiRiddles];
          
          if (catId) {
            eligibleRiddles = eligibleRiddles.filter(r => 
              r.categoryId === parseInt(catId) || r.categoryId === catId
            );
          }
          
          eligibleRiddles = eligibleRiddles.filter(r => r.difficulty === difficulty);
          
          // If no riddles match the criteria, return any riddle
          if (eligibleRiddles.length === 0) {
            eligibleRiddles = [...mockData.mockEmojiRiddles];
          }
          
          // Select a random riddle
          const randomIndex = Math.floor(Math.random() * eligibleRiddles.length);
          resolve(eligibleRiddles[randomIndex]);
          break;
        
        case '/valentine/questions':
          const count = params.count || 10;
          const valDifficulty = params.difficulty || 'medium';
          
          // Filter by difficulty
          let questions = mockData.mockValentineQuestions.filter(q => 
            q.difficulty === valDifficulty
          );
          
          // If not enough questions, add questions from other difficulties
          if (questions.length < count) {
            questions = [...mockData.mockValentineQuestions];
          }
          
          // Shuffle and take requested number
          questions = questions.sort(() => Math.random() - 0.5).slice(0, count);
          
          resolve(questions);
          break;
        
        case '/burble/word':
          const wordDifficulty = params.difficulty || 'medium';
          
          // Filter by difficulty
          let words = mockData.mockBurbleWords.filter(w => 
            w.difficulty === wordDifficulty
          );
          
          // If no words match, return any word
          if (words.length === 0) {
            words = [...mockData.mockBurbleWords];
          }
          
          // Select a random word
          const randomWordIndex = Math.floor(Math.random() * words.length);
          resolve(words[randomWordIndex]);
          break;
        
        case '/user/status':
          resolve({...mockData.mockUserData});
          break;
        
        case '/leaderboard':
          resolve([...mockData.mockLeaderboard]);
          break;
        
        default:
          resolve(null);
      }
    }, 300); // 300ms delay to simulate network
  });
}

/**
 * Simulate post to API using mock data
 */
function simulatePost(endpoint, data) {
  // Add a small delay to simulate network request
  return new Promise(resolve => {
    setTimeout(() => {
      switch (endpoint) {
        case '/riddles/solution':
          // Simulate success response
          const timeToSolve = data.timeToSolve || 60;
          const difficulty = data.difficulty || 'medium';
          const points = calculatePoints(difficulty, timeToSolve);
          
          resolve({
            success: true,
            correct: true,
            points: points,
            message: 'Correct answer!'
          });
          break;
        
        case '/riddles/hint':
          // Find hint in mock data
          const riddleId = data.riddleId;
          let hint = "No hint available.";
          
          if (mockData.mockHints.emoji[riddleId]) {
            hint = mockData.mockHints.emoji[riddleId];
          } else if (mockData.mockHints.burble[riddleId]) {
            hint = mockData.mockHints.burble[riddleId];
          } else {
            // Return a generic hint
            const genericHints = mockData.mockHints.general;
            hint = genericHints[Math.floor(Math.random() * genericHints.length)];
          }
          
          resolve({
            success: true,
            hint: hint
          });
          break;
        
        case '/user/login':
          // Simulate success response
          resolve({
            success: true,
            user: {...mockData.mockUserData}
          });
          break;
        
        default:
          // Default success response
          resolve({
            success: true
          });
      }
    }, 300); // 300ms delay to simulate network
  });
}

/**
 * Calculate points based on difficulty and time to solve
 */
function calculatePoints(difficulty, timeToSolve) {
  // Base points by difficulty
  let basePoints = 0;
  switch (difficulty) {
    case 'easy':
      basePoints = 10;
      break;
    case 'medium':
      basePoints = 15;
      break;
    case 'hard':
      basePoints = 25;
      break;
    case 'extreme':
      basePoints = 40;
      break;
  }
  
  // Time factor (faster = more points)
  const cappedTime = Math.min(timeToSolve, 300); // Cap at 5 minutes
  const timeFactor = Math.max(0.5, 1 - (cappedTime / 600)); // Between 0.5 and 1
  
  return Math.round(basePoints * timeFactor);
}

// Export API functions
export async function getCategories() {
  return fetchGameData('/categories');
}

export async function getRiddlesByCategory(categoryId) {
  return fetchGameData('/riddles/category', { categoryId });
}

export async function getRandomRiddle(categoryId = null, difficulty = null) {
  const params = {};
  if (categoryId) params.categoryId = categoryId;
  if (difficulty) params.difficulty = difficulty;
  
  return fetchGameData('/riddles/random', params);
}

export async function getValentineQuestions(count = 10, difficulty = 'medium') {
  return fetchGameData('/valentine/questions', { count, difficulty });
}

export async function getBurbleWord(difficulty = 'medium') {
  return fetchGameData('/burble/word', { difficulty });
}

export async function getUserStatus() {
  return fetchGameData('/user/status');
}

export async function submitSolution(riddleId, answer, timeToSolve = null) {
  const data = { riddleId, answer };
  if (timeToSolve) data.timeToSolve = timeToSolve;
  
  return postGameData('/riddles/solution', data);
}

export async function getHint(riddleId) {
  return postGameData('/riddles/hint', { riddleId });
}

export async function getLeaderboard() {
  return fetchGameData('/leaderboard');
}

export function isAuthenticated() {
  // For extension, we assume local data only, not authenticated
  return false;
}
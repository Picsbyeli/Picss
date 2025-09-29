/**
 * Burble Chrome Extension - Emoji Game Script
 * 
 * This script handles the Emoji Guess game, where users decipher emoji combinations.
 */

import { getCategories, getRandomRiddle, submitSolution, getHint as getHintFromAPI } from './api.js';

// Game state
let currentGame = {
  riddle: null,
  category: null,
  difficulty: 'medium',
  categoryId: null,
  startTime: null,
  timerInterval: null,
  elapsedSeconds: 0
};

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

/**
 * Initialize the Emoji Guess game
 */
async function initializeGame() {
  setupDifficultySelectors();
  setupCategorySelectors();
  setupGameButtons();
  setupMainMenuButton();
  setupFullAppButton();
  setupNextButton();
  
  // Get difficulty from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const difficultyParam = urlParams.get('difficulty');
  
  if (difficultyParam) {
    setDifficulty(difficultyParam);
  } else {
    // Load saved difficulty preference
    loadPreferences();
  }
}

/**
 * Set up difficulty selector buttons
 */
function setupDifficultySelectors() {
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  
  difficultyOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove active class from all options
      difficultyOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      option.classList.add('active');
      
      // Save selected difficulty
      setDifficulty(option.dataset.difficulty);
    });
  });
}

/**
 * Set up category selector buttons
 */
async function setupCategorySelectors() {
  try {
    // Get categories from API
    const categories = await getCategories();
    
    if (!categories || !categories.length) {
      // If API fails, use default categories
      addDefaultCategories();
      return;
    }
    
    const categoriesGrid = document.getElementById('categories-grid');
    
    // Clear existing categories except "All Categories"
    const allCategoriesOption = categoriesGrid.firstElementChild;
    categoriesGrid.innerHTML = '';
    categoriesGrid.appendChild(allCategoriesOption);
    
    // Add categories from API
    categories.forEach(category => {
      const categoryOption = document.createElement('div');
      categoryOption.className = 'category-option';
      categoryOption.dataset.categoryId = category.id;
      categoryOption.textContent = category.name;
      categoriesGrid.appendChild(categoryOption);
      
      // Add click event
      categoryOption.addEventListener('click', () => {
        // Remove active class from all options
        document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
        
        // Add active class to clicked option
        categoryOption.classList.add('active');
        
        // Save selected category
        setCategory(category.id);
      });
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
    addDefaultCategories();
  }
  
  // Add click event for "All Categories" option
  const allCategoriesOption = document.querySelector('[data-category-id="all"]');
  if (allCategoriesOption) {
    allCategoriesOption.addEventListener('click', () => {
      // Remove active class from all options
      document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      allCategoriesOption.classList.add('active');
      
      // Set category to null (all categories)
      setCategory(null);
    });
  }
}

/**
 * Add default categories if API fails
 */
function addDefaultCategories() {
  const defaultCategories = [
    { id: 1, name: "Movies" },
    { id: 2, name: "Food" },
    { id: 3, name: "Places" },
    { id: 4, name: "Objects" },
    { id: 5, name: "Activities" }
  ];
  
  const categoriesGrid = document.getElementById('categories-grid');
  
  // Clear existing categories except "All Categories"
  const allCategoriesOption = categoriesGrid.firstElementChild;
  categoriesGrid.innerHTML = '';
  categoriesGrid.appendChild(allCategoriesOption);
  
  // Add default categories
  defaultCategories.forEach(category => {
    const categoryOption = document.createElement('div');
    categoryOption.className = 'category-option';
    categoryOption.dataset.categoryId = category.id;
    categoryOption.textContent = category.name;
    categoriesGrid.appendChild(categoryOption);
    
    // Add click event
    categoryOption.addEventListener('click', () => {
      // Remove active class from all options
      document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      categoryOption.classList.add('active');
      
      // Save selected category
      setCategory(category.id);
    });
  });
}

/**
 * Set the game difficulty
 */
function setDifficulty(newDifficulty) {
  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'extreme'];
  if (!validDifficulties.includes(newDifficulty)) {
    newDifficulty = 'medium';
  }
  
  currentGame.difficulty = newDifficulty;
  
  // Update UI to show selected difficulty
  const options = document.querySelectorAll('.difficulty-option');
  options.forEach(option => {
    if (option.dataset.difficulty === newDifficulty) {
      options.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
    }
  });
  
  // Save to storage
  chrome.storage.sync.set({ 'emojiDifficulty': newDifficulty });
}

/**
 * Set the game category
 */
function setCategory(newCategory) {
  currentGame.categoryId = newCategory;
  
  // Save to storage
  chrome.storage.sync.set({ 'emojiCategory': newCategory });
}

/**
 * Set up game buttons (submit, hint)
 */
function setupGameButtons() {
  // Start game button
  document.getElementById('start-game-button').addEventListener('click', startNewGame);
  
  // Submit guess button
  document.getElementById('submit-guess-button').addEventListener('click', submitGuess);
  
  // Hint button
  document.getElementById('hint-button').addEventListener('click', getHintForPuzzle);
  
  // Guess input enter key
  document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  });
  
  // Play again button
  document.getElementById('play-again-button').addEventListener('click', () => {
    // Hide result modal
    document.getElementById('result-container').style.display = 'none';
    
    // Go back to setup
    document.getElementById('game-setup').style.display = 'block';
    document.getElementById('game-play-area').style.display = 'none';
  });
}

/**
 * Set up main menu button
 */
function setupMainMenuButton() {
  document.getElementById('main-menu-button').addEventListener('click', goToMainMenu);
}

/**
 * Set up full app button
 */
function setupFullAppButton() {
  document.getElementById('full-app-button').addEventListener('click', openFullApp);
}

/**
 * Set up next button for when user gets a wrong answer
 */
function setupNextButton() {
  document.getElementById('next-button').addEventListener('click', () => {
    // Hide the result modal
    document.getElementById('result-container').style.display = 'none';
    
    // Start a new game with same settings
    startNewGame();
  });
}

/**
 * Load saved preferences from storage
 */
function loadPreferences() {
  chrome.storage.sync.get(['emojiDifficulty', 'emojiCategory'], (result) => {
    // Load difficulty
    if (result.emojiDifficulty) {
      setDifficulty(result.emojiDifficulty);
    }
    
    // Load category
    if (result.emojiCategory) {
      const categoryOptions = document.querySelectorAll('.category-option');
      categoryOptions.forEach(option => {
        if (option.dataset.categoryId === result.emojiCategory.toString()) {
          categoryOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          currentGame.categoryId = result.emojiCategory;
        }
      });
    }
  });
}

/**
 * Start a new game
 */
async function startNewGame() {
  try {
    // Hide setup, show game
    document.getElementById('game-setup').style.display = 'none';
    document.getElementById('game-play-area').style.display = 'block';
    
    // Reset state
    currentGame.startTime = new Date();
    currentGame.elapsedSeconds = 0;
    
    // Clear previous hint
    const hintDisplay = document.getElementById('hint-display');
    hintDisplay.style.display = 'none';
    hintDisplay.dataset.hintShown = 'false';
    
    // Get new puzzle
    await selectPuzzle();
    
    // Start timer
    startTimer();
    
    // Focus on input
    document.getElementById('guess-input').focus();
  } catch (error) {
    console.error('Failed to start game:', error);
    alert('Failed to start game. Please try again.');
    
    // Go back to setup
    document.getElementById('game-setup').style.display = 'block';
    document.getElementById('game-play-area').style.display = 'none';
  }
}

/**
 * Select a puzzle from the API or fallback
 */
async function selectPuzzle() {
  // Get random riddle based on difficulty and category
  const riddle = await getRandomRiddle(currentGame.categoryId, currentGame.difficulty);
  
  if (!riddle) {
    throw new Error('Failed to get puzzle');
  }
  
  currentGame.riddle = riddle;
  
  // Display puzzle
  document.getElementById('emoji-puzzle').textContent = riddle.question;
  
  // Hide category display
  document.getElementById('puzzle-category').style.display = 'none';
}

/**
 * Get category name from ID
 */
function getCategoryName(categoryId) {
  const categoryOptions = document.querySelectorAll('.category-option');
  for (const option of categoryOptions) {
    if (option.dataset.categoryId === categoryId.toString()) {
      return option.textContent;
    }
  }
  return 'General';
}

/**
 * Get category ID from name
 */
function getCategoryId(categoryName) {
  const categoryOptions = document.querySelectorAll('.category-option');
  for (const option of categoryOptions) {
    if (option.textContent === categoryName) {
      return option.dataset.categoryId;
    }
  }
  return null;
}

/**
 * Start the timer
 */
function startTimer() {
  // Clear any existing timer
  if (currentGame.timerInterval) {
    clearInterval(currentGame.timerInterval);
  }
  
  // Reset timer
  currentGame.startTime = new Date();
  currentGame.elapsedSeconds = 0;
  
  // Update display
  updateTimerDisplay();
  
  // Start interval
  currentGame.timerInterval = setInterval(() => {
    currentGame.elapsedSeconds = Math.floor((new Date() - currentGame.startTime) / 1000);
    updateTimerDisplay();
  }, 1000);
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
  const minutes = Math.floor(currentGame.elapsedSeconds / 60);
  const seconds = currentGame.elapsedSeconds % 60;
  
  document.getElementById('timer').textContent = `${padZero(minutes)}:${padZero(seconds)}`;
}

/**
 * Pad a number with leading zero if needed
 */
function padZero(num) {
  return num.toString().padStart(2, '0');
}

/**
 * Submit a guess
 */
function submitGuess() {
  const guessInput = document.getElementById('guess-input');
  const userAnswer = guessInput.value.trim();
  
  if (!userAnswer) {
    return;
  }
  
  // Stop timer
  if (currentGame.timerInterval) {
    clearInterval(currentGame.timerInterval);
  }
  
  // Check if answer is correct (case insensitive)
  const isCorrect = userAnswer.toLowerCase() === currentGame.riddle.answer.toLowerCase();
  
  // Calculate score
  const points = isCorrect ? calculatePoints(currentGame.difficulty, currentGame.elapsedSeconds) : 0;
  
  // End game
  endGame(isCorrect, currentGame.elapsedSeconds);
  
  // Submit solution to API
  submitSolution(currentGame.riddle.id, userAnswer, currentGame.elapsedSeconds)
    .catch(err => {
      console.log('Failed to submit solution to API', err);
    });
}

/**
 * Get a hint for the current puzzle
 */
function getHintForPuzzle() {
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.textContent = 'Loading hint...';
  hintDisplay.style.display = 'block';
  
  // Track if we're already showing a hint to prevent duplicates
  if (hintDisplay.dataset.hintShown === 'true') {
    return;
  }
  
  // Try to get hint from API
  getHintFromAPI(currentGame.riddle.id)
    .then(response => {
      // Mark that hint is shown to prevent duplicates
      hintDisplay.dataset.hintShown = 'true';
      
      if (response && response.hint) {
        hintDisplay.textContent = response.hint;
      } else if (currentGame.riddle.hint) {
        hintDisplay.textContent = currentGame.riddle.hint;
      } else {
        hintDisplay.textContent = 'Look carefully at each emoji and think about what they represent together.';
      }
    })
    .catch(error => {
      console.error('Failed to get hint:', error);
      
      // Mark that hint is shown to prevent duplicates
      hintDisplay.dataset.hintShown = 'true';
      
      // Use local hint if available
      if (currentGame.riddle.hint) {
        hintDisplay.textContent = currentGame.riddle.hint;
      } else {
        hintDisplay.textContent = 'Look carefully at each emoji and think about what they represent together.';
      }
    });
}

/**
 * End the game and show results
 */
function endGame(isWinner, timeToSolveSeconds) {
  // Calculate points
  const points = isWinner ? calculatePoints(currentGame.difficulty, timeToSolveSeconds) : 0;
  
  // Save game result to stats
  saveGameResult(isWinner, points, timeToSolveSeconds);
  
  // Show result modal
  const resultContainer = document.getElementById('result-container');
  const resultBox = document.getElementById('result-box');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  const resultAnswer = document.getElementById('result-answer');
  const timeDisplay = document.getElementById('time-display');
  const scoreDisplay = document.getElementById('score-display');
  
  // Set result classes and content
  resultBox.className = 'result-box ' + (isWinner ? 'result-win' : 'result-lose');
  resultTitle.textContent = isWinner ? "Correct!" : "Wrong!";
  
  // Get Next button
  const nextButton = document.getElementById('next-button');
  
  if (isWinner) {
    resultMessage.textContent = "Great job solving this emoji puzzle!";
    timeDisplay.textContent = `Time: ${formatTime(timeToSolveSeconds)}`;
    scoreDisplay.textContent = `You earned ${points} points!`;
    // Hide Next button for correct answers
    nextButton.style.display = 'none';
  } else {
    resultMessage.textContent = "Don't worry, emoji puzzles can be tricky!";
    timeDisplay.textContent = '';
    scoreDisplay.textContent = "No points earned. Try again!";
    // Show Next button for incorrect answers
    nextButton.style.display = 'inline-block';
  }
  
  resultAnswer.textContent = currentGame.riddle.answer;
  
  // Show the modal
  resultContainer.style.display = 'flex';
}

/**
 * Format time in minutes and seconds
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${padZero(remainingSeconds)}`;
}

/**
 * Calculate points based on difficulty and time to solve
 */
function calculatePoints(difficulty, timeToSolveSeconds) {
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
    default:
      basePoints = 15;
  }
  
  // Time factor (faster = more points)
  const cappedTime = Math.min(timeToSolveSeconds, 300); // Cap at 5 minutes
  const timeFactor = Math.max(0.5, 1 - (cappedTime / 600)); // Between 0.5 and 1
  
  return Math.round(basePoints * timeFactor);
}

/**
 * Save game result to stats
 */
function saveGameResult(isWinner, score, timeToSolveSeconds) {
  const gameData = {
    gameType: 'emoji',
    difficulty: currentGame.difficulty,
    riddleId: currentGame.riddle.id,
    category: getCategoryName(currentGame.riddle.categoryId),
    correctAnswer: currentGame.riddle.answer,
    timeToSolve: timeToSolveSeconds,
    solved: isWinner,
    points: score,
    playedAt: new Date().toISOString()
  };
  
  // Send to background script to update stats
  chrome.runtime.sendMessage({
    type: 'UPDATE_STATS',
    gameData: gameData
  });
}

/**
 * Go to main menu
 */
function goToMainMenu() {
  // Stop timer if running
  if (currentGame.timerInterval) {
    clearInterval(currentGame.timerInterval);
  }
  
  chrome.tabs.update({ url: 'popup.html' });
}

/**
 * Open the full Burble web app
 */
function openFullApp() {
  chrome.tabs.create({ url: 'https://burble-app.com' });
}
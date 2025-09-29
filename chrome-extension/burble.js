/**
 * Burble Chrome Extension - Burble Word Game Script
 * 
 * This script handles the Burble word guessing game, where users guess words with limited attempts.
 */

import { getBurbleWord, getHint as getHintFromAPI } from './api.js';

// Game state
let currentGame = {
  word: null,
  difficulty: 'medium',
  attempts: 10,
  attemptsUsed: 0,
  hintsUsed: 0,
  startTime: null,
  timerInterval: null,
  elapsedSeconds: 0,
  feedbackHistory: []
};

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

/**
 * Initialize the Burble game
 */
async function initializeGame() {
  setupDifficultySelectors();
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
      
      // Set the difficulty and start a new game
      setDifficulty(option.dataset.difficulty);
    });
  });
}

/**
 * Set the game difficulty
 */
function setDifficulty(newDifficulty) {
  currentGame.difficulty = newDifficulty;
  
  // Set attempts based on difficulty
  switch (newDifficulty) {
    case 'easy':
      currentGame.attempts = 15;
      break;
    case 'medium':
      currentGame.attempts = 10;
      break;
    case 'hard':
      currentGame.attempts = 5;
      break;
    default:
      currentGame.attempts = 10;
  }
  
  // Save preference to storage
  chrome.storage.sync.set({ 'selectedDifficulty': newDifficulty });
  
  // Start a new game with this difficulty
  startNewGame();
}

/**
 * Set up game buttons (submit, hint)
 */
function setupGameButtons() {
  // Submit button
  document.getElementById('submit-button').addEventListener('click', submitGuess);
  
  // Enter key for submission
  document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  });
  
  // Hint button
  document.getElementById('hint-button').addEventListener('click', getHintForWord);
  
  // Play again button
  document.getElementById('play-again-button').addEventListener('click', () => {
    document.getElementById('result-container').style.display = 'none';
    startNewGame();
  });
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
 * Load saved difficulty from storage
 */
function loadPreferences() {
  chrome.storage.sync.get(['selectedDifficulty'], (result) => {
    if (result.selectedDifficulty) {
      setDifficulty(result.selectedDifficulty);
      
      // Update the active difficulty UI
      const options = document.querySelectorAll('.difficulty-option');
      options.forEach(option => {
        if (option.dataset.difficulty === result.selectedDifficulty) {
          options.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        }
      });
    } else {
      // Default to medium if no preference is saved
      setDifficulty('medium');
    }
  });
}

/**
 * Start a new game
 */
async function startNewGame() {
  // Reset game state
  currentGame.attemptsUsed = 0;
  currentGame.hintsUsed = 0;
  currentGame.feedbackHistory = [];
  currentGame.startTime = Date.now();
  
  // Clear displays
  document.getElementById('word-display').innerHTML = '';
  document.getElementById('feedback-container').innerHTML = '';
  document.getElementById('guess-input').value = '';
  document.getElementById('attempts-count').textContent = currentGame.attempts;
  
  // Get a new word based on difficulty
  try {
    const wordData = await getBurbleWord(currentGame.difficulty);
    currentGame.word = wordData.word.toUpperCase();
    
    // Create empty word display
    const wordDisplay = document.getElementById('word-display');
    wordDisplay.innerHTML = '';
    
    for (let i = 0; i < currentGame.word.length; i++) {
      const letterBox = document.createElement('div');
      letterBox.className = 'letter-box';
      letterBox.textContent = '';
      wordDisplay.appendChild(letterBox);
    }
    
  } catch (error) {
    console.error('Failed to get word:', error);
    // Fallback to a default word if API fails
    currentGame.word = getRandomWord(currentGame.difficulty);
    
    // Create empty word display
    const wordDisplay = document.getElementById('word-display');
    wordDisplay.innerHTML = '';
    
    for (let i = 0; i < currentGame.word.length; i++) {
      const letterBox = document.createElement('div');
      letterBox.className = 'letter-box';
      letterBox.textContent = '';
      wordDisplay.appendChild(letterBox);
    }
  }
  
  // Enable input
  document.getElementById('guess-input').disabled = false;
  document.getElementById('submit-button').disabled = false;
}

/**
 * Get a random word if API fails
 */
function getRandomWord(difficulty) {
  const easyWords = ['HAPPY', 'SMILE', 'HEART', 'SWEET', 'LOVE'];
  const mediumWords = ['CHARM', 'ADORE', 'FANCY', 'BLISS', 'DREAM'];
  const hardWords = ['CHERISH', 'PASSION', 'ECSTASY', 'DEVOTED', 'EMBRACE'];
  
  let wordList;
  switch (difficulty) {
    case 'easy':
      wordList = easyWords;
      break;
    case 'medium':
      wordList = mediumWords;
      break;
    case 'hard':
      wordList = hardWords;
      break;
    default:
      wordList = mediumWords;
  }
  
  return wordList[Math.floor(Math.random() * wordList.length)];
}

/**
 * Submit a guess
 */
function submitGuess() {
  const guessInput = document.getElementById('guess-input');
  const guess = guessInput.value.trim().toUpperCase();
  
  // Validate input
  if (guess.length !== currentGame.word.length) {
    alert(`Please enter a ${currentGame.word.length}-letter word.`);
    return;
  }
  
  // Check guess
  const feedback = checkGuess(guess);
  addFeedbackToDisplay(guess, feedback);
  
  // Update attempts
  currentGame.attemptsUsed++;
  document.getElementById('attempts-count').textContent = currentGame.attempts - currentGame.attemptsUsed;
  
  // Clear input
  guessInput.value = '';
  
  // Check for win/lose conditions
  if (feedback.every(f => f === 2)) {
    // Win - all letters match exactly
    const timeToSolve = Math.floor((Date.now() - currentGame.startTime) / 1000);
    endGame(true, timeToSolve);
  } else if (currentGame.attemptsUsed >= currentGame.attempts) {
    // Lose - out of attempts
    endGame(false);
  }
}

/**
 * Check the guess against the current word
 * Returns an array of feedback codes:
 * 0 = letter not in word
 * 1 = letter in word but wrong position
 * 2 = letter in correct position
 */
function checkGuess(guess) {
  const word = currentGame.word;
  const feedback = Array(word.length).fill(0);
  const letterCounts = {};
  
  // Count letters in the word
  for (const letter of word) {
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
  }
  
  // First pass: Mark correct positions
  for (let i = 0; i < word.length; i++) {
    if (guess[i] === word[i]) {
      feedback[i] = 2;
      letterCounts[guess[i]]--;
    }
  }
  
  // Second pass: Mark letters in wrong positions
  for (let i = 0; i < word.length; i++) {
    if (feedback[i] !== 2 && letterCounts[guess[i]] > 0) {
      feedback[i] = 1;
      letterCounts[guess[i]]--;
    }
  }
  
  return feedback;
}

/**
 * Add feedback to the display
 */
function addFeedbackToDisplay(guess, feedback) {
  const feedbackContainer = document.getElementById('feedback-container');
  const feedbackRow = document.createElement('div');
  feedbackRow.className = 'feedback-row';
  
  for (let i = 0; i < guess.length; i++) {
    const letterBox = document.createElement('div');
    letterBox.className = 'letter-box';
    letterBox.textContent = guess[i];
    
    if (feedback[i] === 2) {
      letterBox.classList.add('correct-position');
    } else if (feedback[i] === 1) {
      letterBox.classList.add('correct-letter');
    } else {
      letterBox.classList.add('wrong-letter');
    }
    
    feedbackRow.appendChild(letterBox);
  }
  
  // Add to history and display
  currentGame.feedbackHistory.push({ guess, feedback });
  feedbackContainer.prepend(feedbackRow);
}

/**
 * Get a hint for the current word
 */
async function getHintForWord() {
  // Check if we have attempts to spare
  if (currentGame.attemptsUsed >= currentGame.attempts - 1) {
    alert("Not enough attempts left to use a hint!");
    return;
  }
  
  try {
    const hint = await getHintFromAPI(currentGame.word);
    alert(hint || "Try a word with the letter " + currentGame.word[0]);
    
    // Using a hint costs an attempt
    currentGame.attemptsUsed++;
    currentGame.hintsUsed++;
    document.getElementById('attempts-count').textContent = currentGame.attempts - currentGame.attemptsUsed;
  } catch (error) {
    console.error("Error getting hint:", error);
    alert("Hint: Try a word with the letter " + currentGame.word[0]);
    
    // Using a hint still costs an attempt even if API fails
    currentGame.attemptsUsed++;
    currentGame.hintsUsed++;
    document.getElementById('attempts-count').textContent = currentGame.attempts - currentGame.attemptsUsed;
  }
}

/**
 * End the game and show results
 */
function endGame(isWinner, timeToSolveSeconds = 0) {
  // Disable input
  document.getElementById('guess-input').disabled = true;
  document.getElementById('submit-button').disabled = true;
  
  // Show result modal
  const resultContainer = document.getElementById('result-container');
  const resultBox = document.getElementById('result-box');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  const resultAnswer = document.getElementById('result-answer');
  const scoreDisplay = document.getElementById('score-display');
  const nextButton = document.getElementById('next-button');
  
  // Set result classes and content
  resultBox.className = 'result-box ' + (isWinner ? 'result-win' : 'result-lose');
  resultTitle.textContent = isWinner ? "Word Solved!" : "Out of Attempts!";
  
  if (isWinner) {
    const points = calculatePoints(currentGame.difficulty);
    resultMessage.textContent = `Great job! You guessed the word in ${currentGame.attemptsUsed} attempts.`;
    scoreDisplay.textContent = `You earned ${points} points!`;
    nextButton.style.display = 'none';
    
    // Save game result to stats
    saveGameResult(true, points, timeToSolveSeconds);
  } else {
    resultMessage.textContent = "Don't worry, word games can be challenging!";
    scoreDisplay.textContent = "No points earned. Try again!";
    // Show Next button for incorrect answers
    nextButton.style.display = 'inline-block';
  }
  
  resultAnswer.textContent = currentGame.word;
  
  // Show the modal
  resultContainer.style.display = 'flex';
}

/**
 * Calculate points based on difficulty
 */
function calculatePoints(difficulty) {
  // Base points by difficulty - these are the new values you requested
  let basePoints = 0;
  switch (difficulty) {
    case 'easy':
      basePoints = 25;
      break;
    case 'medium':
      basePoints = 35;
      break;
    case 'hard':
      basePoints = 50;
      break;
    default:
      basePoints = 35;
  }
  
  // Adjust points based on attempts and hints used
  const attemptFactor = 1 - (currentGame.attemptsUsed / (currentGame.attempts * 2));
  const hintPenalty = currentGame.hintsUsed * 5;
  
  return Math.max(Math.round(basePoints * (1 + attemptFactor) - hintPenalty), basePoints / 2);
}

/**
 * Save game result to stats
 */
function saveGameResult(isWinner, score, timeToSolveSeconds) {
  chrome.runtime.sendMessage({
    type: 'UPDATE_STATS',
    gameData: {
      gameType: 'burble',
      solved: isWinner,
      points: score,
      timeToSolve: timeToSolveSeconds
    }
  });
}

/**
 * Go to main menu
 */
function goToMainMenu() {
  window.location.href = 'popup.html';
}

/**
 * Open the full Burble web app
 */
function openFullApp() {
  chrome.tabs.create({ url: 'https://burble-app.com' });
}
/**
 * Burble Chrome Extension - Valentine Game Script
 * 
 * This script handles the "Are You My Valentine?" guessing game.
 */

import { getValentineQuestions, submitSolution } from './api.js';

// Game state
let currentGame = {
  questions: [],
  currentQuestion: 0,
  answeredQuestions: 0,
  attemptsLeft: 0,
  correctAnswer: '',
  difficulty: 'medium',
  askedQuestions: [],
  hintsUsed: 0
};

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

/**
 * Initialize the Valentine game
 */
async function initializeGame() {
  setupDifficultySelectors();
  setupAnswerButtons();
  setupHintButton();
  setupMainMenuButton();
  setupFullAppButton();
  setupPlayAgainButton();
  
  // Get difficulty from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const difficultyParam = urlParams.get('difficulty');
  
  if (difficultyParam) {
    setDifficulty(difficultyParam);
  } else {
    // Load saved difficulty preference
    loadDifficulty();
  }
  
  // Start button event listener
  document.getElementById('start-game-button').addEventListener('click', startNewGame);
  
  // Setup guess input form
  document.getElementById('submit-guess-button').addEventListener('click', submitGuess);
  document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  });
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
  chrome.storage.sync.set({ 'valentineDifficulty': newDifficulty });
}

/**
 * Load saved difficulty from storage
 */
function loadDifficulty() {
  chrome.storage.sync.get(['valentineDifficulty'], (result) => {
    if (result.valentineDifficulty) {
      setDifficulty(result.valentineDifficulty);
    }
  });
}

/**
 * Set up answer buttons (Yes/No/Unsure)
 */
function setupAnswerButtons() {
  document.getElementById('yes-button').addEventListener('click', () => answerQuestion('yes'));
  document.getElementById('no-button').addEventListener('click', () => answerQuestion('no'));
  document.getElementById('unsure-button').addEventListener('click', () => answerQuestion('unsure'));
}

/**
 * Set up hint button
 */
function setupHintButton() {
  document.getElementById('hint-button').addEventListener('click', getHint);
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
 * Set up play again button
 */
function setupPlayAgainButton() {
  document.getElementById('play-again-button').addEventListener('click', () => {
    // Hide result modal
    document.getElementById('result-container').style.display = 'none';
    
    // Go back to difficulty selector
    document.getElementById('difficulty-selector').style.display = 'block';
    document.getElementById('game-play-area').style.display = 'none';
    document.getElementById('guess-container').style.display = 'none';
  });
}

/**
 * Start a new game
 */
async function startNewGame() {
  // Reset game state
  currentGame.currentQuestion = 0;
  currentGame.answeredQuestions = 0;
  currentGame.askedQuestions = [];
  currentGame.hintsUsed = 0;
  
  // Set attempts based on difficulty
  switch (currentGame.difficulty) {
    case 'easy':
      currentGame.attemptsLeft = 12;
      break;
    case 'medium':
      currentGame.attemptsLeft = 10;
      break;
    case 'hard':
      currentGame.attemptsLeft = 8;
      break;
    case 'extreme':
      currentGame.attemptsLeft = 6;
      break;
  }
  
  // Show game area, hide difficulty selector
  document.getElementById('difficulty-selector').style.display = 'none';
  document.getElementById('game-play-area').style.display = 'block';
  document.getElementById('guess-container').style.display = 'none';
  
  // Reset hint display
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.style.display = 'none';
  hintDisplay.dataset.hintShown = 'false';
  
  // Update attempts display
  document.getElementById('attempts-text').textContent = `Questions remaining: ${currentGame.attemptsLeft}`;
  
  try {
    // Generate questions
    await generateQuestions();
    
    // Ask first question
    askNextQuestion();
  } catch (error) {
    console.error('Failed to start game:', error);
    alert('Failed to start game. Please try again.');
    
    // Go back to difficulty selector
    document.getElementById('difficulty-selector').style.display = 'block';
    document.getElementById('game-play-area').style.display = 'none';
  }
}

/**
 * Generate list of questions for the game
 */
async function generateQuestions() {
  try {
    // Get questions from API
    const questions = await getValentineQuestions(20, currentGame.difficulty);
    
    // If no questions, throw error
    if (!questions || !questions.length) {
      throw new Error('No questions available');
    }
    
    // Get all unique answers
    const answers = Array.from(new Set(questions.map(q => q.answer)));
    
    // Randomly select one answer
    const selectedAnswer = answers[Math.floor(Math.random() * answers.length)];
    currentGame.correctAnswer = selectedAnswer;
    
    // Filter questions to only include those for the selected answer
    currentGame.questions = questions.filter(q => q.answer === selectedAnswer);
    
    // Shuffle questions
    currentGame.questions = shuffleArray(currentGame.questions);
  } catch (error) {
    console.error('Failed to generate questions:', error);
    throw error;
  }
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Ask the next question
 */
function askNextQuestion() {
  // Check if we have more questions
  if (currentGame.currentQuestion >= currentGame.questions.length) {
    // Out of questions, show the guess input
    showGuessInput();
    return;
  }
  
  // Get next question
  const question = currentGame.questions[currentGame.currentQuestion];
  currentGame.currentQuestion++;
  
  // Display question
  displayQuestion(question);
}

/**
 * Display a question
 */
function displayQuestion(question) {
  document.getElementById('question-text').textContent = question.question;
  document.getElementById('attempts-text').textContent = `Questions remaining: ${currentGame.attemptsLeft}`;
  
  // Hide and reset hint display
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.style.display = 'none';
  hintDisplay.dataset.hintShown = 'false';
}

/**
 * Handle user answer to a question
 */
function answerQuestion(answer) {
  // Add question to asked questions
  currentGame.askedQuestions.push({
    question: currentGame.questions[currentGame.currentQuestion - 1].question,
    answer: answer
  });
  
  currentGame.answeredQuestions++;
  currentGame.attemptsLeft--;
  
  // Check if we're out of attempts
  if (currentGame.attemptsLeft <= 0) {
    showGuessInput();
    return;
  }
  
  // Ask the next question
  askNextQuestion();
}

/**
 * Get a hint (uses one attempt)
 */
function getHint() {
  // Check if we have attempts left
  if (currentGame.attemptsLeft <= 0) {
    return;
  }
  
  const hintDisplay = document.getElementById('hint-display');
  
  // Track if we're already showing a hint to prevent duplicates
  if (hintDisplay.dataset.hintShown === 'true') {
    return;
  }
  
  // Use one attempt
  currentGame.attemptsLeft--;
  currentGame.hintsUsed++;
  
  // Display hint
  const hint = generateHint();
  
  // Mark that hint is shown to prevent duplicates
  hintDisplay.dataset.hintShown = 'true';
  
  hintDisplay.textContent = hint;
  hintDisplay.style.display = 'block';
  
  // Update attempts display
  document.getElementById('attempts-text').textContent = `Questions remaining: ${currentGame.attemptsLeft}`;
  
  // Check if we're out of attempts
  if (currentGame.attemptsLeft <= 0) {
    showGuessInput();
  }
}

/**
 * Generate a hint for the user
 */
function generateHint() {
  // Basic hint based on the answer
  const answer = currentGame.correctAnswer.toLowerCase();
  
  if (answer === 'doctor') {
    const hints = [
      "I help people when they're sick.",
      "I might work in a hospital.",
      "I studied medicine for many years.",
      "I can prescribe medication.",
      "People come to me when they have health problems."
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  } else if (answer === 'superhero') {
    const hints = [
      "I have special abilities that normal people don't have.",
      "I fight against evil and protect innocent people.",
      "I might wear a special costume.",
      "I might have a secret identity.",
      "I'm often featured in comic books and movies."
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  } else {
    // Generic hint
    return `Think about people you know a lot about. The answer might surprise you.`;
  }
}

/**
 * Show the guess input for final answer
 */
function showGuessInput() {
  document.getElementById('guess-container').style.display = 'block';
  document.getElementById('question-text').textContent = "Time to guess! Who am I?";
  document.getElementById('attempts-text').textContent = "No questions remaining";
  
  // Focus on input
  document.getElementById('guess-input').focus();
}

/**
 * Submit final guess
 */
function submitGuess() {
  const guessInput = document.getElementById('guess-input');
  const userAnswer = guessInput.value.trim();
  
  if (!userAnswer) {
    return;
  }
  
  // Score based on attempts left and hint usage
  const baseScore = 
    currentGame.difficulty === 'easy' ? 20 :
    currentGame.difficulty === 'medium' ? 30 :
    currentGame.difficulty === 'hard' ? 40 : 50;
  
  // Check if answer is correct (case insensitive)
  const isCorrect = userAnswer.toLowerCase() === currentGame.correctAnswer.toLowerCase();
  
  // Calculate score (0 if incorrect)
  const score = isCorrect ? baseScore - (currentGame.hintsUsed * 5) : 0;
  
  // End the game
  endGame(isCorrect, userAnswer, score);
}

/**
 * End the game and show results
 */
function endGame(isWinner, userAnswer, score) {
  // Save game result
  saveGameResult(isWinner, score, userAnswer);
  
  // Show result modal
  const resultContainer = document.getElementById('result-container');
  const resultBox = document.getElementById('result-box');
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  const resultAnswer = document.getElementById('result-answer');
  const scoreDisplay = document.getElementById('score-display');
  
  // Set result classes and content
  resultBox.className = 'result-box ' + (isWinner ? 'result-win' : 'result-lose');
  resultTitle.textContent = isWinner ? "Correct!" : "Wrong!";
  
  if (isWinner) {
    resultMessage.textContent = "You found your Valentine! Great job!";
    scoreDisplay.textContent = `You earned ${score} points!`;
  } else {
    resultMessage.textContent = `Your Valentine was ${currentGame.correctAnswer}.`;
    scoreDisplay.textContent = "No points earned. Try again!";
  }
  
  resultAnswer.textContent = currentGame.correctAnswer;
  
  // Show the modal
  resultContainer.style.display = 'flex';
}

/**
 * Save game result to stats
 */
function saveGameResult(isWinner, score, answer) {
  const gameData = {
    gameType: 'valentine',
    difficulty: currentGame.difficulty,
    correctAnswer: currentGame.correctAnswer,
    userAnswer: answer,
    hintsUsed: currentGame.hintsUsed,
    questionsAsked: currentGame.answeredQuestions,
    solved: isWinner,
    points: score,
    playedAt: new Date().toISOString()
  };
  
  // Send to background script to update stats
  chrome.runtime.sendMessage({
    type: 'UPDATE_STATS',
    gameData: gameData
  });
  
  // Try to submit to server (will use mock if offline)
  submitSolution(0, answer).catch(err => {
    console.log('Failed to submit solution to server', err);
  });
}

/**
 * Go back to main menu
 */
function goToMainMenu() {
  chrome.tabs.update({ url: 'popup.html' });
}

/**
 * Open the full Burble web app
 */
function openFullApp() {
  chrome.tabs.create({ url: 'https://burble-app.com' });
}
/**
 * Burble Chrome Extension Popup Script
 * 
 * This script handles the main extension popup interface.
 */

import { getUserStatus } from './api.js';

// Initialize when the popup is loaded
document.addEventListener('DOMContentLoaded', initializeExtension);

/**
 * Initialize the extension popup
 */
async function initializeExtension() {
  setupDifficultySelectors();
  setupGameButtons();
  setupFullAppButton();
  
  // Load saved preferences (difficulty)
  loadPreferences();
  
  // Load and display user stats
  try {
    const userData = await getUserStatus();
    updateStatsDisplay(userData);
  } catch (error) {
    console.error('Failed to load user data:', error);
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
      
      // Save selected difficulty to storage
      const difficulty = option.dataset.difficulty;
      chrome.storage.sync.set({ 'selectedDifficulty': difficulty });
    });
  });
}

/**
 * Set up game selection buttons
 */
function setupGameButtons() {
  const gameButtons = document.querySelectorAll('.game-button');
  
  gameButtons.forEach(button => {
    button.addEventListener('click', () => {
      const gameType = button.dataset.game;
      
      // Don't navigate to "coming soon" games
      if (button.querySelector('.coming-soon')) {
        return;
      }
      
      startGame(gameType);
    });
  });
}

/**
 * Setup full app button
 */
function setupFullAppButton() {
  const fullAppButton = document.getElementById('full-app-button');
  
  fullAppButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://burble-app.com' });
  });
}

/**
 * Load saved preferences from storage
 */
function loadPreferences() {
  chrome.storage.sync.get(['selectedDifficulty'], (result) => {
    if (result.selectedDifficulty) {
      // Set active difficulty button
      const options = document.querySelectorAll('.difficulty-option');
      options.forEach(option => {
        if (option.dataset.difficulty === result.selectedDifficulty) {
          options.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        }
      });
    }
  });
}

/**
 * Start a game based on selected type
 */
function startGame(gameType) {
  // Get selected difficulty
  const activeDifficultyElement = document.querySelector('.difficulty-option.active');
  const difficulty = activeDifficultyElement ? activeDifficultyElement.dataset.difficulty : 'medium';
  
  switch (gameType) {
    case 'valentine':
      chrome.tabs.create({ url: `valentine.html?difficulty=${difficulty}` });
      break;
    
    case 'emoji':
      chrome.tabs.create({ url: `emoji.html?difficulty=${difficulty}` });
      break;
    
    case 'burble':
      chrome.tabs.create({ url: `burble.html?difficulty=${difficulty}` });
      break;
    
    default:
      console.warn('Unknown game type:', gameType);
  }
}

/**
 * Update stats display with user data
 */
function updateStatsDisplay(userData) {
  // Set stats from user data
  document.getElementById('stats-score').textContent = userData.score || 0;
  document.getElementById('stats-solved').textContent = userData.solvedCount || 0;
  document.getElementById('stats-valentines').textContent = userData.valentineCount || 0;
  document.getElementById('stats-emojis').textContent = userData.emojiCount || 0;
}
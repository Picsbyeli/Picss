/**
 * Burble Chrome Extension Background Script
 * 
 * This service worker runs in the background and handles:
 * - Game stats tracking
 * - Analytics
 * - Notifications
 */

// Default game stats
const DEFAULT_STATS = {
  score: 0,
  solvedCount: 0,
  valentineCount: 0,
  emojiCount: 0,
  burbleCount: 0,
  lastUpdated: Date.now()
};

// Listen for installation event
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Burble Brain Teasers extension installed');
  
  // Initialize storage with default values if not already set
  const stats = await chrome.storage.sync.get('gameStats');
  if (!stats.gameStats) {
    chrome.storage.sync.set({ 'gameStats': DEFAULT_STATS });
  }
  
  // Set up alarm for periodic updates (optional feature)
  chrome.alarms.create('dailyUpdate', { periodInMinutes: 1440 }); // Once per day
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyUpdate') {
    console.log('Performing daily update');
    // Future feature: Daily puzzles, reminders, etc.
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATS') {
    updateGameStats(message.gameData)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
  
  if (message.type === 'GET_STATS') {
    chrome.storage.sync.get('gameStats')
      .then(data => sendResponse({ success: true, stats: data.gameStats || DEFAULT_STATS }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

/**
 * Update game statistics based on game result
 */
async function updateGameStats(gameData) {
  try {
    // Get current stats
    const data = await chrome.storage.sync.get('gameStats');
    const stats = data.gameStats || DEFAULT_STATS;
    
    // Update stats based on game data
    if (gameData.points) {
      stats.score += gameData.points;
    }
    
    if (gameData.solved) {
      stats.solvedCount += 1;
      
      // Update game-specific counters
      if (gameData.gameType === 'valentine') {
        stats.valentineCount += 1;
      } else if (gameData.gameType === 'emoji') {
        stats.emojiCount += 1;
      } else if (gameData.gameType === 'burble') {
        stats.burbleCount += 1;
      }
    }
    
    stats.lastUpdated = Date.now();
    
    // Save updated stats
    await chrome.storage.sync.set({ 'gameStats': stats });
    
    return stats;
  } catch (error) {
    console.error('Error updating game stats:', error);
    throw error;
  }
}
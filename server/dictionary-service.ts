import fetch from 'node-fetch';

/**
 * Service that provides dictionary-related functionality
 */
export const dictionaryService = {
  /**
   * Checks if a word exists in the English dictionary
   * Uses the Free Dictionary API
   * @param word The word to check
   * @returns true if the word exists, false otherwise
   */
  async isRealWord(word: string): Promise<boolean> {
    try {
      // Clean the word - remove spaces, special chars, etc.
      const cleanWord = word.trim().toLowerCase();
      
      // If the word is too short, it's probably not valid
      if (cleanWord.length < 2) {
        return false;
      }
      
      // Check if it's in the dictionary API
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
      
      // Return true if we got a successful response (meaning the word exists)
      return response.status === 200;
    } catch (error) {
      console.error('Error checking word in dictionary:', error);
      // If there's an error, we'll be lenient and assume it might be a valid word
      return true;
    }
  }
};
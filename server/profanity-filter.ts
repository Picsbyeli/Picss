// Direct implementation of basic profanity filter
// We'll implement our own simple filter since the bad-words module is causing issues
class CustomFilter {
  private words: string[];
  
  constructor() {
    this.words = [];
    
    // Initialize with default word list
    this.addWords(
      'shit', 'ass', 'fuck', 'cunt', 'slut', 'bitch', 'whore', 'bastard',
      'pussy', 'dick', 'cocksucker', 'motherfucker', 'damn', 'hell',
      'retard', 'fag', 'faggot', 'homo', 'nigger', 'nigga', 'spic', 'wetback',
      'chink', 'dyke', 'kike', 'tranny', 'nazi', 'piss'
    );
  }
  
  addWords(...words: string[]) {
    this.words.push(...words);
  }
  
  isProfane(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return this.words.some(word => lowerText.includes(word.toLowerCase()));
  }
  
  clean(text: string): string {
    if (!text) return '';
    let cleanedText = text;
    this.words.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
    });
    return cleanedText;
  }
}

const filter = new CustomFilter();

// Check if text contains profanity
export function containsProfanity(text: string): boolean {
  return filter.isProfane(text);
}

// Clean profanity from text (replace with asterisks)
export function cleanProfanity(text: string): string {
  return filter.clean(text);
}

// Validate username (no profanity, length requirements, etc.)
export function validateUsername(username: string): { valid: boolean; message?: string } {
  // Check length
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { valid: false, message: 'Username must be no more than 20 characters long' };
  }
  
  // Check for profanity
  if (containsProfanity(username)) {
    return { valid: false, message: 'Username contains inappropriate language' };
  }
  
  // Check for valid characters (letters, numbers, and limited special chars)
  const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validUsernameRegex.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, dots, underscores, and hyphens' };
  }
  
  return { valid: true };
}

// Validate email format and content
export function validateEmail(email: string): { valid: boolean; message?: string } {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  // Check for profanity in email
  const emailParts = email.split('@');
  if (containsProfanity(emailParts[0]) || containsProfanity(emailParts[1])) {
    return { valid: false, message: 'Email contains inappropriate language' };
  }
  
  // Specific banned patterns (case-insensitive)
  const bannedPatterns = [
    'uselssshit', 
    'shit', 
    'fuck', 
    'ass',
    'dick',
    'pussy',
    'bitch'
  ];
  
  const lowerEmail = email.toLowerCase();
  for (const pattern of bannedPatterns) {
    if (lowerEmail.includes(pattern)) {
      return { valid: false, message: 'This email address is not allowed' };
    }
  }
  
  return { valid: true };
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one number and one letter
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    return { valid: false, message: 'Password must contain at least one letter and one number' };
  }
  
  return { valid: true };
}
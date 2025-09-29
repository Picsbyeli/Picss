import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

// Word categories and sample words
const wordCategories = {
  Food: {
    4: ['cake', 'taco', 'rice', 'soup', 'bean', 'fish', 'pear', 'plum'],
    5: ['pizza', 'apple', 'salad', 'pasta', 'fruit', 'onion', 'bread', 'steak'],
    6: ['burger', 'cheese', 'cookie', 'banana', 'orange', 'tomato', 'potato'],
    7: ['avocado', 'chicken', 'pancake', 'almond', 'noodles', 'sausage'],
    8: ['broccoli', 'mushroom', 'sandwich', 'blueberry', 'eggplant', 'pineapple']
  },
  Animals: {
    4: ['frog', 'wolf', 'bear', 'deer', 'bird', 'fish', 'lion', 'duck'],
    5: ['tiger', 'sheep', 'snake', 'mouse', 'panda', 'koala', 'horse'],
    6: ['turtle', 'giraffe', 'monkey', 'beaver', 'weasel', 'rabbit'],
    7: ['dolphin', 'penguin', 'octopus', 'raccoon', 'leopard', 'buffalo'],
    8: ['elephant', 'hedgehog', 'flamingo', 'kangaroo', 'scorpion', 'crocodile']
  },
  Colors: {
    4: ['blue', 'pink', 'gold', 'gray', 'teal', 'cyan'],
    5: ['green', 'brown', 'black', 'white', 'amber', 'azure'],
    6: ['purple', 'silver', 'indigo', 'maroon', 'ochre', 'orange'],
    7: ['crimson', 'magenta', 'cerulean', 'lavender', 'turquoise'],
    8: ['burgundy', 'periwinkle', 'sapphire', 'platinum', 'marigold']
  },
  Cities: {
    4: ['rome', 'oslo', 'bali', 'lima', 'york', 'lyon', 'riga', 'kiev'],
    5: ['tokyo', 'paris', 'miami', 'delhi', 'dubai', 'seoul', 'cairo'],
    6: ['london', 'berlin', 'moscow', 'madrid', 'munich', 'sydney'],
    7: ['beijing', 'chicago', 'toronto', 'atlanta', 'houston', 'phoenix'],
    8: ['shanghai', 'istanbul', 'budapest', 'montreal', 'florence', 'helsinki']
  },
  Items: {
    4: ['fork', 'lamp', 'book', 'ring', 'desk', 'mask', 'pen', 'phone', 'shoe'],
    5: ['table', 'chair', 'clock', 'brush', 'phone', 'purse', 'scarf', 'watch'],
    6: ['mirror', 'pillow', 'remote', 'candle', 'wallet', 'hammer', 'laptop'],
    7: ['charger', 'suitcase', 'backpack', 'earbuds', 'cushion', 'toaster'],
    8: ['scissors', 'notebook', 'umbrella', 'keyboard', 'television', 'bookshelf']
  },
  Sports: {
    4: ['golf', 'swim', 'bike', 'surf', 'bowl', 'judo', 'dive', 'ski'],
    5: ['chess', 'rugby', 'skate', 'climb', 'kayak', 'dance', 'jog', 'cycle'],
    6: ['soccer', 'hockey', 'tennis', 'boxing', 'rowing', 'hiking', 'racing'],
    7: ['archery', 'bowling', 'cricket', 'fencing', 'jogging', 'baseball'],
    8: ['football', 'basketball', 'wrestling', 'athletics', 'marathon', 'swimming']
  },
  Jobs: {
    4: ['chef', 'cop', 'vet', 'host', 'waiter', 'maid', 'tech', 'tutor'],
    5: ['nurse', 'actor', 'pilot', 'agent', 'clerk', 'coach', 'judge', 'baker'],
    6: ['banker', 'dentist', 'painter', 'teacher', 'doctor', 'driver', 'singer'],
    7: ['manager', 'surgeon', 'designer', 'plumber', 'engineer', 'janitor'],
    8: ['fireman', 'therapist', 'director', 'musician', 'developer', 'scientist']
  },
  Words: {
    4: ['play', 'work', 'time', 'love', 'life', 'help', 'kind', 'cool', 'open'],
    5: ['happy', 'brave', 'peace', 'learn', 'enjoy', 'smart', 'dream', 'laugh'],
    6: ['joyful', 'friend', 'nature', 'wealth', 'energy', 'wonder', 'wisdom'],
    7: ['inspire', 'courage', 'freedom', 'harmony', 'believe', 'achieve'],
    8: ['faithful', 'knowledge', 'gratitude', 'laughter', 'adventure', 'compassion']
  }
};

// Game states
type GameState = 'setup' | 'loading' | 'playing' | 'gameover';
type GameDifficulty = 'easy' | 'medium' | 'hard';
type WordLength = '4' | '5' | '6' | '7' | '8';

// Main Burble Game Component
export default function Burble() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('setup');
  const [wordLength, setWordLength] = useState<WordLength>('4');
  const [gameDifficulty, setGameDifficulty] = useState<GameDifficulty>('medium');
  const [category, setCategory] = useState<keyof typeof wordCategories>('Food');
  const [targetWord, setTargetWord] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [maxAttempts, setMaxAttempts] = useState(10); // Default medium difficulty
  const [remainingAttempts, setRemainingAttempts] = useState(10);
  const [gameMessage, setGameMessage] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wordData, setWordData] = useState<any[]>([]);

  // Start a new game
  const startGame = async () => {
    // Set attempts based on game difficulty
    let attempts = 10; // Default medium
    if (gameDifficulty === 'easy') {
      attempts = 15;
    } else if (gameDifficulty === 'hard') {
      attempts = 5;
    }
    
    // Setup game state with loading indicator
    setAttempts([]);
    setScores([]);
    setMaxAttempts(attempts);
    setRemainingAttempts(attempts);
    setCurrentAttempt('');
    setHintUsed(false);
    setShowHint(false);
    setGameState('loading');
    setGameMessage('Loading a verified dictionary word...');
    
    try {
      // Get word candidates from the selected category and word length
      const words = wordCategories[category][wordLength];
      
      // Try to find a valid dictionary word
      let validWordFound = false;
      let randomWord = '';
      let attemptsToFindWord = 0;
      const maxAttemptsToFindWord = 10; // Limit our attempts to find a valid word
      
      while (!validWordFound && attemptsToFindWord < maxAttemptsToFindWord) {
        // Get a random word from our list
        randomWord = words[Math.floor(Math.random() * words.length)];
        attemptsToFindWord++;
        
        // Validate with dictionary API
        try {
          const response = await fetch(`/api/dictionary/validate/${randomWord}`);
          const data = await response.json();
          
          if (data.isValid) {
            validWordFound = true;
          }
        } catch (error) {
          console.error("Error validating word:", error);
          // If API fails, we'll use the word anyway
          validWordFound = true;
        }
      }
      
      // Use the word we found (or last attempt if no valid words found)
      setTargetWord(randomWord);
      setGameState('playing');
      
      // Update game message based on difficulty
      let difficultyLabel = `${gameDifficulty.charAt(0).toUpperCase() + gameDifficulty.slice(1)} mode`;
      setGameMessage(`Category: ${category} - Find the ${wordLength}-letter word (${difficultyLabel})`);
      
      // Show difficulty-specific toast message
      toast({
        title: `${difficultyLabel} Selected`,
        description: gameDifficulty === 'hard' ? 
          `You have ${attempts} attempts, but you can get 1 hint!` : 
          `You have ${attempts} attempts to guess the word.`,
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Error Starting Game",
        description: "Something went wrong while starting the game. Please try again.",
        variant: "destructive",
      });
      setGameState('setup');
    }
  };

  // Calculate score for an attempt
  const calculateScore = (attempt: string): number => {
    if (attempt.length !== parseInt(wordLength)) {
      return 0; // Incorrect length attempt gets 0 points
    }
    
    let score = 0;
    
    // Check for correct letters (1 point each)
    const targetLetters = targetWord.split('');
    const attemptLetters = attempt.split('');
    
    // First pass: check for exact matches (2 points each)
    for (let i = 0; i < targetLetters.length; i++) {
      if (attemptLetters[i] === targetLetters[i]) {
        score += 2;
        // Mark these as used
        targetLetters[i] = '*';
        attemptLetters[i] = '#';
      }
    }
    
    // Second pass: check for letters in wrong positions (1 point each)
    for (let i = 0; i < attemptLetters.length; i++) {
      if (attemptLetters[i] !== '#') { // Skip already matched letters
        const letterIndex = targetLetters.indexOf(attemptLetters[i]);
        if (letterIndex !== -1) {
          score += 1;
          // Mark as used
          targetLetters[letterIndex] = '*';
        }
      }
    }
    
    return score;
  };

  // Get hint for the target word (only in hard mode)
  const getHint = () => {
    if (gameDifficulty !== 'hard' || hintUsed) return;
    
    // Generate a hint - reveal a random letter from the target word
    const letterPositions = [];
    for (let i = 0; i < targetWord.length; i++) {
      letterPositions.push(i);
    }
    
    // Shuffle array to pick a random position
    letterPositions.sort(() => Math.random() - 0.5);
    const hintPosition = letterPositions[0];
    
    // Create the hint message
    const hintMessage = `Letter at position ${hintPosition + 1} is "${targetWord[hintPosition].toUpperCase()}"`;
    setShowHint(true);
    setHintUsed(true);
    
    toast({
      title: "Hint Used!",
      description: hintMessage,
      className: "bg-yellow-100 border-yellow-700"
    });
  };
  
  // Submit attempt
  const submitAttempt = async () => {
    if (currentAttempt.length !== parseInt(wordLength)) {
      toast({
        title: "Invalid Length",
        description: `Your guess must be exactly ${wordLength} letters.`,
        variant: "destructive",
      });
      return;
    }
    
    const newAttempt = currentAttempt.toLowerCase();
    
    // Check if the word is valid using dictionary API
    try {
      const response = await fetch(`/api/dictionary/validate/${newAttempt}`);
      const data = await response.json();
      
      if (!data.isValid) {
        toast({
          title: "Invalid Word",
          description: `"${newAttempt}" is not a valid English word. Please try again.`,
          variant: "destructive",
        });
        return;
      }
      
      // Word is valid, continue with the game
      const score = calculateScore(newAttempt);
      
      // Update state
      setAttempts([...attempts, newAttempt]);
      setScores([...scores, score]);
      setCurrentAttempt('');
      setRemainingAttempts(remainingAttempts - 1);
      
      // Check if player guessed correctly
      if (newAttempt === targetWord) {
        setGameState('gameover');
        const attemptsUsed = maxAttempts - (remainingAttempts - 1);
        setGameMessage(`Congratulations! You found the word "${targetWord.toUpperCase()}" with ${remainingAttempts - 1} attempts remaining! (Used ${attemptsUsed} attempts)`);
        return;
      }
      
      // Check if out of attempts
      if (remainingAttempts <= 1) {
        setGameState('gameover');
        setGameMessage(`Game Over! The word was "${targetWord.toUpperCase()}". Better luck next time!`);
        
        // Mark the answer as viewed if the user is logged in
        if (user) {
          // Since we're using predefined word categories rather than database riddles,
          // we'll just track that the user viewed an answer
          // In a production app, you would fetch the riddle ID from the database
          toast({
            title: "Answer Revealed",
            description: "You won't earn points for solving this word now.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error validating word:", error);
      // If there's an error with the validation API, we'll be lenient and allow the word
      const score = calculateScore(newAttempt);
      
      // Update state
      setAttempts([...attempts, newAttempt]);
      setScores([...scores, score]);
      setCurrentAttempt('');
      setRemainingAttempts(remainingAttempts - 1);
    }
  };

  // Render attempt rows with scores
  const renderAttempts = () => {
    return attempts.map((attempt, index) => (
      <div key={index} className="flex items-center mb-3">
        <Badge className="mr-3 bg-primary text-white w-8 h-8 flex items-center justify-center text-sm">
          {scores[index]}
        </Badge>
        <div className="flex space-x-2">
          {attempt.split('').map((letter, letterIndex) => (
            <div 
              key={letterIndex}
              className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center uppercase font-bold text-lg"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  // Render empty slots for next attempt
  const renderEmptySlots = () => {
    return Array.from({ length: parseInt(wordLength) }).map((_, index) => (
      <div 
        key={index}
        className="w-10 h-10 border-2 border-gray-300 rounded-md flex items-center justify-center"
      ></div>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Burble</h1>
          <p className="text-center text-gray-500 mb-6">
            A word guessing game where points show how close you are!
          </p>

          {gameState === 'setup' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Game Difficulty</label>
                <Select value={gameDifficulty} onValueChange={(value: any) => setGameDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy Mode (15 Attempts)</SelectItem>
                    <SelectItem value="medium">Medium Mode (10 Attempts)</SelectItem>
                    <SelectItem value="hard">Hard Mode (5 Attempts + 1 Hint)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Word Length</label>
                <Select value={wordLength} onValueChange={(value: any) => setWordLength(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select word length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Letters</SelectItem>
                    <SelectItem value="5">5 Letters</SelectItem>
                    <SelectItem value="6">6 Letters</SelectItem>
                    <SelectItem value="7">7 Letters</SelectItem>
                    <SelectItem value="8">8 Letters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Category</label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(wordCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button className="w-full" onClick={startGame}>
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {gameState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium">{gameMessage}</p>
              <p className="text-sm text-gray-500 mt-2">Ensuring we use real dictionary words...</p>
            </div>
          )}
          
          {(gameState === 'playing' || gameState === 'gameover') && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Badge className="px-3 py-1 text-sm">{gameMessage}</Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Attempts: {maxAttempts - remainingAttempts}/{maxAttempts}
                </Badge>
              </div>

              <div className="space-y-6">
                {/* Previous attempts */}
                <div className="space-y-2">
                  {renderAttempts()}
                </div>

                {/* Current attempt input */}
                {gameState === 'playing' && (
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      {renderEmptySlots()}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        value={currentAttempt}
                        onChange={(e) => setCurrentAttempt(e.target.value.toLowerCase())}
                        placeholder={`Enter a ${wordLength}-letter word`}
                        maxLength={parseInt(wordLength)}
                        className="flex-1"
                      />
                      <Button onClick={submitAttempt}>Submit</Button>
                    </div>
                    
                    {/* Show hint button only in hard mode and if hint not used yet */}
                    {gameDifficulty === 'hard' && !hintUsed && (
                      <div className="flex justify-center pt-2">
                        <Button 
                          variant="outline" 
                          onClick={getHint}
                          className="text-sm"
                        >
                          Use Hint (1 available)
                        </Button>
                      </div>
                    )}
                    
                    {/* Display hint message if hint was used */}
                    {showHint && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center text-yellow-800 text-sm">
                        Hint used! Check the toast message for your hint.
                      </div>
                    )}
                  </div>
                )}

                {/* Game over actions */}
                {gameState === 'gameover' && (
                  <div className="flex justify-center space-x-4 pt-4">
                    <Button onClick={startGame} variant="default">
                      Play Again
                    </Button>
                    <Button onClick={() => setGameState('setup')} variant="outline">
                      Change Settings
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Game rules */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">How to Play Burble</h2>
          <div className="space-y-3 text-sm">
            <p>1. Choose a difficulty level (4-8 letter words) and category.</p>
            <p>2. You have 5 attempts to guess the target word.</p>
            <p>3. After each guess, you'll see a score showing how close you are:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>1 point for each correct letter in the wrong position</li>
              <li>2 points for each letter in the correct position</li>
            </ul>
            <p>4. The maximum score equals the total points possible for the word (2 points per letter).</p>
            <p>5. Use the score to refine your next guess!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
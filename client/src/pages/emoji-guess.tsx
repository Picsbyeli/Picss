import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FavoriteButton } from "@/components/ui/favorite-button";
import AIHintButton from "@/components/ai/ai-hint-button";

// Game difficulty type
type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

// Game type (movies, foods, household-items, etc.)
type EmojiType = 'movies' | 'tv-shows' | 'foods' | 'household-items' | 'all' | string;

// Game state
type GameState = 'setup' | 'playing' | 'complete';

// Emoji puzzle type
type EmojiPuzzle = {
  id: number;
  question: string; // Emoji string
  answer: string;
  explanation: string;
  hint: string;
  difficulty: string;
  categoryId: number;
  category: {
    name: string;
    colorClass: string;
  };
};

export default function EmojiGuess() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [emojiType, setEmojiType] = useState<EmojiType>('all');
  const [currentPuzzle, setCurrentPuzzle] = useState<EmojiPuzzle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [puzzlesCounter, setPuzzlesCounter] = useState({ current: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [solvedPuzzles, setSolvedPuzzles] = useState<number[]>([]);
  
  // Get a standardized category name from the puzzle explanation/hint
  const getDerivedCategory = (puzzle: EmojiPuzzle): string => {
    const textToCheck = (puzzle.explanation || '').toLowerCase() + ' ' + (puzzle.hint || '').toLowerCase();
    
    if (textToCheck.includes('movie')) return 'Movie';
    if (textToCheck.includes('tv') || textToCheck.includes('show') || textToCheck.includes('series')) return 'TV Show';
    if (textToCheck.includes('food') || textToCheck.includes('dish') || textToCheck.includes('meal')) return 'Food';
    if (textToCheck.includes('item') || textToCheck.includes('object') || textToCheck.includes('thing')) return 'Household Item';
    if (textToCheck.includes('sport') || textToCheck.includes('game') || textToCheck.includes('athletic')) return 'Sport/Game';
    if (textToCheck.includes('place') || textToCheck.includes('location') || textToCheck.includes('destination')) return 'Place';
    if (textToCheck.includes('celebrity') || textToCheck.includes('famous') || textToCheck.includes('star')) return 'Celebrity';
    if (textToCheck.includes('character') || textToCheck.includes('fictional')) return 'Character';
    if (textToCheck.includes('book') || textToCheck.includes('novel')) return 'Book';
    if (textToCheck.includes('song') || textToCheck.includes('music') || textToCheck.includes('band')) return 'Music';
    if (textToCheck.includes('car') || textToCheck.includes('vehicle') || textToCheck.includes('transport')) return 'Vehicle';
    if (textToCheck.includes('animal') || textToCheck.includes('creature')) return 'Animal';
    
    return 'Entertainment';
  };
  
  // Fetch all emoji puzzles
  const { data: allPuzzles = [] } = useQuery<EmojiPuzzle[]>({
    queryKey: ['/api/riddles/with-categories'],
    select: (data) => data.filter((puzzle) => {
      // First check if it's an Emoji Guess puzzle
      if (puzzle.category.name !== 'Emoji Guess') return false;
      
      // If 'all' is selected, include all emoji puzzles
      if (emojiType === 'all') return true;
      
      // For specific categories, check both explanation and hint fields
      const textToSearch = (puzzle.explanation || '') + ' ' + (puzzle.hint || '');
      const lowerText = textToSearch.toLowerCase();
      
      // Handle specific category searches using standardized category names
      switch(emojiType) {
        case 'movies':
          return lowerText.includes('movie') || lowerText.includes('film');
        case 'tv-shows':
          return lowerText.includes('tv') || lowerText.includes('show') || lowerText.includes('series');
        case 'foods':
          return lowerText.includes('food') || lowerText.includes('dish') || lowerText.includes('meal');
        case 'household-items':
          return lowerText.includes('item') || lowerText.includes('object') || lowerText.includes('tool');
        default:
          // Fallback to checking if the exact category name appears in the text
          return lowerText.includes(typeof emojiType === 'string' ? emojiType.toLowerCase() : '');
      }
    }),
  });
  
  // Filter puzzles by difficulty
  const filteredPuzzles = allPuzzles.filter(
    (puzzle) => puzzle.difficulty === difficulty && !solvedPuzzles.includes(puzzle.id)
  );
  
  // Start a new game
  const startGame = () => {
    if (filteredPuzzles.length === 0) {
      toast({
        title: "No puzzles available",
        description: "Try a different difficulty level or type",
        variant: "destructive",
      });
      return;
    }
    
    // Get a random puzzle
    const randomIndex = Math.floor(Math.random() * filteredPuzzles.length);
    const puzzle = filteredPuzzles[randomIndex];
    
    setCurrentPuzzle(puzzle);
    setUserAnswer('');
    setHintsUsed(0);
    setShowHint(false);
    setIsCorrect(false);
    setPuzzlesCounter({
      current: solvedPuzzles.length + 1,
      total: filteredPuzzles.length,
    });
    setGameState('playing');
  };
  
  // Check the user's answer
  const checkAnswer = () => {
    if (!currentPuzzle) return;
    
    // Standardize both answers for comparison
    const standardizeAnswer = (answer: string): string => {
      return answer
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Convert number words to digits for comparison
    const convertNumberWords = (text: string): string => {
      const numberMap: {[key: string]: string} = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
        'fourteen': '14', 'fifteen': '15', 'twenty': '20', 'thirty': '30',
        'forty': '40', 'fifty': '50', 'hundred': '100', 'thousand': '1000'
      };

      let result = text;
      Object.keys(numberMap).forEach(word => {
        // Replace whole word occurrences only
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        result = result.replace(regex, numberMap[word]);
      });
      
      return result;
    };
    
    const standardUserAnswer = standardizeAnswer(userAnswer);
    const standardCorrectAnswer = standardizeAnswer(currentPuzzle.answer);
    
    // Also prepare versions with number words converted to digits
    const digitConvertedUserAnswer = convertNumberWords(standardUserAnswer);
    const digitConvertedCorrectAnswer = convertNumberWords(standardCorrectAnswer);
    
    // Check for exact match after standardization
    let isAnswerCorrect = 
      standardUserAnswer === standardCorrectAnswer || 
      digitConvertedUserAnswer === digitConvertedCorrectAnswer;
    
    // If not exact, try more flexible matching
    if (!isAnswerCorrect) {
      // Check for variations with/without spaces
      const noSpaceUser = standardUserAnswer.replace(/\s+/g, '');
      const noSpaceCorrect = standardCorrectAnswer.replace(/\s+/g, '');
      const noSpaceUserDigits = digitConvertedUserAnswer.replace(/\s+/g, '');
      const noSpaceCorrectDigits = digitConvertedCorrectAnswer.replace(/\s+/g, '');

      if (noSpaceUser === noSpaceCorrect || 
          noSpaceUserDigits === noSpaceCorrectDigits) {
        isAnswerCorrect = true;
      }
    }
    
    // Calculate points
    let pointsEarned = 0;
    if (isAnswerCorrect) {
      // Base points by difficulty
      if (difficulty === 'easy') pointsEarned = 10;
      else if (difficulty === 'medium') pointsEarned = 15;
      else if (difficulty === 'hard') pointsEarned = 25;
      else if (difficulty === 'extreme') pointsEarned = 40;
      
      // Subtract points for hints (5 per hint)
      pointsEarned = Math.max(0, pointsEarned - (hintsUsed * 5));
      
      setScore((prevScore) => prevScore + pointsEarned);
      setIsCorrect(true);
      setSolvedPuzzles((prev) => [...prev, currentPuzzle.id]);
      
      // Mark the answer as viewed in the database (but it doesn't affect points since they solved it correctly)
      if (user && currentPuzzle) {
        // Call the API to mark this puzzle as viewed
        fetch('/api/mark-viewed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            riddleId: currentPuzzle.id,
            userId: user.id
          }),
        }).catch(error => {
          console.error("Error marking riddle as viewed:", error);
        });
      }
      
      toast({
        title: "Correct!",
        description: `You earned ${pointsEarned} points.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Try again or use a hint!",
        variant: "destructive",
      });
    }
  };
  
  // Get a hint
  const getHint = () => {
    if (!currentPuzzle) return;
    
    setHintsUsed((prev) => prev + 1);
    setShowHint(true);
    
    toast({
      title: "Hint used",
      description: "Using hints reduces points earned",
      variant: "destructive",
    });
  };
  
  // Next puzzle
  const nextPuzzle = () => {
    if (filteredPuzzles.length <= 1) {
      setGameState('complete');
      return;
    }
    
    // Filter out the current puzzle and any solved puzzles
    const availablePuzzles = filteredPuzzles.filter(
      (puzzle) => puzzle.id !== currentPuzzle?.id && !solvedPuzzles.includes(puzzle.id)
    );
    
    if (availablePuzzles.length === 0) {
      setGameState('complete');
      return;
    }
    
    // Get a random puzzle from available puzzles
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    const puzzle = availablePuzzles[randomIndex];
    
    setCurrentPuzzle(puzzle);
    setUserAnswer('');
    setHintsUsed(0);
    setShowHint(false);
    setIsCorrect(false);
    setPuzzlesCounter({
      current: solvedPuzzles.length + 1,
      total: availablePuzzles.length + 1, // +1 because we're counting the current puzzle too
    });
  };
  
  // Reset the game
  const resetGame = () => {
    setGameState('setup');
    setCurrentPuzzle(null);
    setUserAnswer('');
    setHintsUsed(0);
    setScore(0);
    setPuzzlesCounter({ current: 0, total: 0 });
    setShowHint(false);
    setIsCorrect(false);
    setSolvedPuzzles([]);
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-500">
        Emoji Guess Challenge
      </h1>
      
      {/* Game Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
          <CardDescription>
            Guess the movie, food, or item based on the emoji combinations!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each puzzle is a series of emojis that hint at a movie, food, item, or other concept</li>
            <li>Type your guess in the answer box and submit</li>
            <li>If you're stuck, you can use a hint, but it will reduce your points</li>
            <li>Points are awarded based on difficulty: Easy (10), Medium (15), Hard (25), Extreme (40)</li>
            <li>Each hint used reduces your points by 5</li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Game Setup */}
      {gameState === 'setup' && (
        <Card className="border-2 border-indigo-200 overflow-hidden shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
            <CardTitle className="text-center text-xl font-bold text-indigo-800">
              <span className="flex justify-center items-center gap-2">
                <i className="ri-game-line text-indigo-600 text-2xl"></i>
                Start New Emoji Game
                <i className="ri-emotion-laugh-line text-indigo-600 text-2xl"></i>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Difficulty Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 text-indigo-800 flex items-center">
                <span className="bg-indigo-100 p-1.5 rounded-full mr-2">
                  <i className="ri-speed-up-line text-indigo-600"></i>
                </span>
                Select Difficulty:
              </h3>
              <div className="flex flex-wrap gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-sm">
                <Badge 
                  className={`cursor-pointer px-5 py-2.5 text-base font-bold border-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    difficulty === 'easy' 
                      ? "bg-green-600 text-white border-green-700 shadow-md dark:bg-green-500 dark:border-green-600" 
                      : "bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border-green-400 dark:border-green-700"
                  }`}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy (10 pts)
                </Badge>
                <Badge 
                  className={`cursor-pointer px-5 py-2.5 text-base font-bold border-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    difficulty === 'medium' 
                      ? "bg-blue-600 text-white border-blue-700 shadow-md dark:bg-blue-500 dark:border-blue-600" 
                      : "bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-400 dark:border-blue-700"
                  }`}
                  onClick={() => setDifficulty('medium')}
                >
                  Medium (15 pts)
                </Badge>
                <Badge 
                  className={`cursor-pointer px-5 py-2.5 text-base font-bold border-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    difficulty === 'hard' 
                      ? "bg-amber-600 text-white border-amber-700 shadow-md dark:bg-amber-500 dark:border-amber-600" 
                      : "bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-400 dark:border-amber-700"
                  }`}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard (25 pts)
                </Badge>
                <Badge 
                  className={`cursor-pointer px-5 py-2.5 text-base font-bold border-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    difficulty === 'extreme' 
                      ? "bg-red-600 text-white border-red-700 shadow-md dark:bg-red-500 dark:border-red-600" 
                      : "bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border-red-400 dark:border-red-700"
                  }`}
                  onClick={() => setDifficulty('extreme')}
                >
                  Extreme (40 pts)
                </Badge>
              </div>
            </div>
            
            {/* Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 text-indigo-800 flex items-center">
                <span className="bg-indigo-100 p-1.5 rounded-full mr-2">
                  <i className="ri-shapes-line text-indigo-600"></i>
                </span>
                Select Category:
              </h3>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <Tabs 
                  defaultValue="all" 
                  onValueChange={(value) => setEmojiType(value as EmojiType)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 mb-4 bg-white p-1.5 border-2 border-indigo-200 rounded-lg">
                    <TabsTrigger 
                      value="all" 
                      className="font-bold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-2.5"
                    >
                      All Types
                    </TabsTrigger>
                    <TabsTrigger 
                      value="movies" 
                      className="font-bold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-2.5"
                    >
                      Movies
                    </TabsTrigger>
                    <TabsTrigger 
                      value="foods" 
                      className="font-bold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-2.5"
                    >
                      Foods
                    </TabsTrigger>
                    <TabsTrigger 
                      value="household-items" 
                      className="font-bold text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md px-4 py-2.5"
                    >
                      Items
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="text-4xl">🎮</div>
                    <div className="text-4xl">🎬</div>
                    <div className="text-4xl">🍕</div>
                    <div className="text-4xl">⚽</div>
                  </div>
                </Tabs>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-200 p-6">
            <Button 
              onClick={startGame} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-lg border-2 border-green-600 transition-all duration-200 transform hover:scale-105"
            >
              <i className="ri-gamepad-line mr-2 text-xl"></i>
              Start Emoji Game
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Game Play */}
      {gameState === 'playing' && currentPuzzle && (
        <div className="space-y-6">
          {/* Game Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Puzzle {puzzlesCounter.current} of {puzzlesCounter.total}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`py-1 px-3 font-semibold ${
                    difficulty === 'easy'
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : difficulty === 'medium'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : difficulty === 'hard'
                          ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                          : 'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}>
                    <span className="font-bold">{difficulty.toUpperCase()}</span>
                  </Badge>
                  <Badge className="bg-indigo-100 text-indigo-800 border-2 border-indigo-300 py-1 px-3 font-semibold">
                    Score: <span className="font-bold ml-1">{score}</span>
                  </Badge>
                  {currentPuzzle && 
                    <FavoriteButton 
                      riddleId={currentPuzzle.id} 
                      size="sm"
                      alwaysShow={true}
                      className="transition-all duration-300 hover:scale-110 ml-1" 
                    />
                  }
                </div>
              </div>
              {currentPuzzle.explanation && (
                <div className="mt-3 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base mr-1 text-yellow-900">CATEGORY:</span>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 text-base uppercase font-bold border border-yellow-600 shadow-sm">
                      {(() => {
                        const text = (currentPuzzle.explanation || '') + ' ' + (currentPuzzle.hint || '');
                        const lowerText = text.toLowerCase();
                        
                        if (lowerText.includes('movie') || lowerText.includes('film')) {
                          return 'Movies';
                        } else if (lowerText.includes('tv') || lowerText.includes('show') || lowerText.includes('series')) {
                          return 'TV Shows';
                        } else if (lowerText.includes('food') || lowerText.includes('dish') || lowerText.includes('meal')) {
                          return 'Foods';
                        } else if (lowerText.includes('item') || lowerText.includes('object') || lowerText.includes('tool')) {
                          return 'Household Items';
                        } else if (lowerText.includes('place') || lowerText.includes('location')) {
                          return 'Places';
                        } else if (lowerText.includes('sport') || lowerText.includes('game') || lowerText.includes('athletic')) {
                          return 'Sports';
                        } else if (lowerText.includes('celebrity') || lowerText.includes('person') || lowerText.includes('actor')) {
                          return 'Famous People';
                        } else if (lowerText.includes('animal') || lowerText.includes('creature')) {
                          return 'Animals';
                        } else {
                          return 'Entertainment';
                        }
                      })()}
                    </Badge>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {/* Emoji Display with Category Indicator */}
              <div className="relative w-full max-w-xl mx-auto">
                <div className="mb-3 flex justify-center">
                  <Badge className="bg-indigo-600 text-white px-4 py-2 text-sm font-bold">
                    Difficulty: {currentPuzzle.difficulty.charAt(0).toUpperCase() + currentPuzzle.difficulty.slice(1)}
                  </Badge>
                </div>
                
                <div className="text-6xl md:text-8xl my-4 text-center leading-normal p-8 bg-gradient-to-br from-amber-100 to-purple-100 rounded-xl border-4 border-yellow-300 shadow-lg relative">
                  <div className="animate-pulse">
                    {currentPuzzle.question}
                  </div>
                  
                  {/* Category Badge - Top */}
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-1.5 rounded-full text-base font-bold uppercase shadow-lg border-2 border-yellow-600">
                    Category: {getDerivedCategory(currentPuzzle)}
                  </div>
                </div>
                
                {/* Additional category information below the emoji display */}
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <span className="text-amber-800 font-medium">Guess the {getDerivedCategory(currentPuzzle).toLowerCase()} based on these emojis!</span>
                </div>
              </div>
              
              {/* Hint */}
              {showHint && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-100 border-2 border-amber-300 p-4 rounded-lg mb-6 w-full shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-amber-200 p-2 rounded-full">
                      <i className="ri-lightbulb-flash-line text-amber-600 text-xl"></i>
                    </div>
                    <h3 className="font-bold text-amber-800 text-lg">Hint:</h3>
                    <Badge className="ml-auto bg-red-100 text-red-600 border-2 border-red-300 px-3 py-1 text-sm font-bold">-5 points</Badge>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-md border border-amber-200">{currentPuzzle.hint}</p>
                    
                    {/* AI Hint Button */}
                    <div className="flex justify-end">
                      <AIHintButton 
                        riddle={`These emoji '${currentPuzzle.question}' represent '${currentPuzzle.answer}' which is a ${
                          currentPuzzle.explanation.toLowerCase().includes('movie') ? 'movie' :
                          currentPuzzle.explanation.toLowerCase().includes('tv') ? 'TV show' :
                          currentPuzzle.explanation.toLowerCase().includes('food') ? 'food item' :
                          currentPuzzle.explanation.toLowerCase().includes('item') ? 'household item' :
                          'entertainment concept'
                        }. Give a middle-school friendly hint that helps understand what these emoji represent.`} 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Answer Input */}
              {!isCorrect ? (
                <div className="w-full max-w-md bg-white p-4 rounded-lg border-2 border-indigo-200 shadow-md">
                  <h3 className="font-bold text-indigo-800 mb-3 text-center">Enter Your Answer</h3>
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="text"
                      placeholder="Your answer..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="flex-1 border-2 border-indigo-300 focus:border-indigo-500 h-11"
                    />
                    <Button 
                      onClick={checkAnswer} 
                      disabled={!userAnswer.trim()}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-5 h-11"
                    >
                      Check
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={getHint} 
                      disabled={showHint}
                      className="flex-1 border-2 border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold"
                    >
                      Get Hint (-5 points)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-2 border-red-400 text-red-700 hover:bg-red-50 font-semibold"
                      onClick={() => {
                        // Mark the answer as viewed in the database
                        if (user && currentPuzzle) {
                          fetch('/api/mark-viewed', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              riddleId: currentPuzzle.id,
                              userId: user.id
                            }),
                          }).catch(error => {
                            console.error("Error marking riddle as viewed:", error);
                          });
                        }
                        
                        setIsCorrect(true);
                        toast({
                          title: "You gave up",
                          description: "No points awarded. The answer is revealed.",
                          variant: "destructive",
                        });
                      }}
                    >
                      Give Up (No points)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full mt-4">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-3 border-green-300 p-6 rounded-lg mb-6 relative shadow-lg">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-1.5 rounded-full text-base font-bold uppercase shadow-lg border-2 border-green-400">
                      🎉 CORRECT! 🎉
                    </div>
                    
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <h3 className="font-bold text-green-800 text-xl">Answer:</h3>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 text-base uppercase font-bold border border-yellow-600 shadow-sm">
                        {currentPuzzle.explanation.toLowerCase().includes('movie') 
                          ? 'Movie' 
                          : currentPuzzle.explanation.toLowerCase().includes('food') 
                            ? 'Food'
                            : currentPuzzle.explanation.toLowerCase().includes('item')
                              ? 'Item'
                              : 'General'}
                      </Badge>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg border-2 border-green-200 shadow-inner mb-6">
                      <p className="text-green-700 text-3xl font-bold pb-4 text-center">
                        {currentPuzzle.answer}
                      </p>
                      
                      <div className="flex justify-center items-center gap-3 mb-4">
                        <Badge className="bg-purple-100 text-purple-700 border-2 border-purple-300 px-4 py-1.5 text-base font-bold">
                          +15 Points
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 border-2 border-blue-300 px-4 py-1.5 text-base font-bold">
                          Total: {score} Points
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-5 rounded-lg border-2 border-green-200 shadow-md mb-4">
                      <h4 className="font-bold text-green-800 mb-3 text-lg flex items-center">
                        <div className="bg-green-200 p-1.5 rounded-full mr-2">
                          <i className="ri-information-line text-green-700 text-xl"></i>
                        </div>
                        About this puzzle:
                      </h4>
                      <p className="text-green-800 text-lg">{currentPuzzle.explanation}</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={nextPuzzle} 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 text-lg shadow-md"
                  >
                    Next Puzzle →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Game Controls */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetGame}>
              Back to Setup
            </Button>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Hints Used: {hintsUsed}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Complete */}
      {gameState === 'complete' && (
        <Card className="border-4 border-purple-300 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-100 to-purple-100 border-b-4 border-yellow-300">
            <CardTitle className="text-center text-2xl font-bold text-purple-800">
              <span className="flex justify-center items-center gap-2">
                <i className="ri-trophy-line text-yellow-500 text-3xl"></i>
                Game Complete!
                <i className="ri-trophy-line text-yellow-500 text-3xl"></i>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 bg-gradient-to-br from-white to-purple-50">
            <div className="mb-6 relative inline-block">
              <div className="text-7xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">{score}</div>
              <p className="text-xl mb-6 font-bold text-purple-800">Your Final Score</p>
              <div className="absolute -top-4 -right-4 text-4xl animate-pulse">🎉</div>
              <div className="absolute -bottom-4 -left-4 text-4xl animate-pulse">🎊</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-md mb-8 max-w-md mx-auto">
              <p className="text-lg text-purple-800">You've completed all the puzzles at this difficulty level!</p>
            </div>
            
            <Button 
              onClick={resetGame} 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg"
            >
              Play Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
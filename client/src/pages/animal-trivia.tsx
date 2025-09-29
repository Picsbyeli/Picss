import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Clock, Brain, Zap, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Animal trivia questions data
const animalTriviaQuestions = [
  {
    id: 1,
    question: "What mammal has the most powerful bite in the world?",
    options: ["Lion", "Hippopotamus", "Grizzly bear"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 2,
    question: "What is a male swan called?",
    options: ["Cob", "Gander", "Drake"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 3,
    question: "What color is the polar bear's skin beneath its fur?",
    options: ["Black", "White", "Pink"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 4,
    question: "What bird has the largest wingspan?",
    options: ["Andean condor", "Wandering albatross", "Bald eagle"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 5,
    question: "How many eyes does a honeybee have?",
    options: ["2", "5", "8"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 6,
    question: "How many degrees can an owl rotate its head?",
    options: ["180°", "270°", "360°"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 7,
    question: "What is the fastest land mammal?",
    options: ["Cheetah", "Lion", "Greyhound"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 8,
    question: "Which animal's fingerprints are nearly identical to humans?",
    options: ["Gorilla", "Koala", "Chimpanzee"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 9,
    question: "What is the only mammal capable of true sustained flight?",
    options: ["Bat", "Flying squirrel", "Hawk"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 10,
    question: "How many legs do spiders have?",
    options: ["6", "8", "10"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 11,
    question: "Which animal breathes through its skin?",
    options: ["Frog", "Snake", "Lizard"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 12,
    question: "What do you call a group of crows?",
    options: ["Pack", "Murder", "Flock"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 13,
    question: "Which bird is famous for mimicking human speech?",
    options: ["Parrot", "Crow", "Starling"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 14,
    question: "How many stomachs does a cow have?",
    options: ["1", "2", "4"],
    correct: 2,
    difficulty: "medium"
  },
  {
    id: 15,
    question: "What is a baby kangaroo called?",
    options: ["Joey", "Pup", "Calf"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 16,
    question: "Which animal is the biggest land carnivore?",
    options: ["Lion", "Polar bear", "Tiger"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 17,
    question: "What is the only marsupial native to North America?",
    options: ["Kangaroo", "Koala", "Opossum"],
    correct: 2,
    difficulty: "medium"
  },
  {
    id: 18,
    question: "What is the largest species of penguin?",
    options: ["King penguin", "Emperor penguin", "Gentoo penguin"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 19,
    question: "Which sea creature is known for changing its color and texture to blend in?",
    options: ["Jellyfish", "Octopus", "Seahorse"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 20,
    question: "What animal uses echolocation for navigation?",
    options: ["Dolphin", "Otter", "Manatee"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 21,
    question: "What is a group of flamingos called?",
    options: ["Flock", "Pod", "Flamboyance"],
    correct: 2,
    difficulty: "hard"
  },
  {
    id: 22,
    question: "What is the main diet of a panda?",
    options: ["Bamboo", "Meat", "Fruits"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 23,
    question: "How many hearts does an octopus have?",
    options: ["One", "Two", "Three"],
    correct: 2,
    difficulty: "hard"
  },
  {
    id: 24,
    question: "What is the world's fastest bird in flight?",
    options: ["Sparrow", "Peregrine falcon", "Eagle"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 25,
    question: "What mammal lays eggs?",
    options: ["Platypus", "Rabbit", "Otter"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 26,
    question: "Which marine animal is the largest in the world?",
    options: ["Whale shark", "Blue whale", "Giant squid"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 27,
    question: "Which insect has organized farming habits?",
    options: ["Termite", "Ant", "Bee"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 28,
    question: "Which bird migrates the farthest distance?",
    options: ["Arctic tern", "Barn swallow", "Stork"],
    correct: 0,
    difficulty: "hard"
  },
  {
    id: 29,
    question: "How do butterflies taste their food?",
    options: ["Antennae", "Feet", "Mouth"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 30,
    question: "Which fish is the fastest swimmer?",
    options: ["Sailfish", "Tuna", "Marlin"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 31,
    question: "What bird is the symbol of wisdom?",
    options: ["Crow", "Owl", "Eagle"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 32,
    question: "What's the smallest dog breed?",
    options: ["Chihuahua", "Pomeranian", "Papillon"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 33,
    question: "Which bird can swim but cannot fly?",
    options: ["Penguin", "Ostrich", "Kiwi"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 34,
    question: "What is the largest rodent in the world?",
    options: ["Beaver", "Capybara", "Muskrat"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 35,
    question: "Which animal has the thickest fur?",
    options: ["Sea otter", "Polar bear", "Seal"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 36,
    question: "Which insect produces light?",
    options: ["Firefly", "Butterfly", "Cricket"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 37,
    question: "Which mammal is the slowest?",
    options: ["Sloth", "Mole", "Manatee"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 38,
    question: "What bird can run the fastest?",
    options: ["Ostrich", "Chicken", "Turkey"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 39,
    question: "Which animal has the largest eyes?",
    options: ["Horse", "Squid", "Giraffe"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 40,
    question: "Which insect can carry multiples of its own body weight?",
    options: ["Bee", "Ant", "Fly"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 41,
    question: "Which spider is notorious for its red hourglass mark?",
    options: ["Tarantula", "Black widow", "Brown recluse"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 42,
    question: "Which animal has the loudest call?",
    options: ["Lion", "Howler monkey", "Elephant"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 43,
    question: "What color are giraffe tongues?",
    options: ["Black", "Purple-black", "Pink"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 44,
    question: "Which bird lays the largest eggs?",
    options: ["Ostrich", "Eagle", "Swan"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 45,
    question: "Which animal can see ultraviolet light?",
    options: ["Dog", "Bee", "Snake"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 46,
    question: "Which bird can hover like a helicopter?",
    options: ["Hawk", "Hummingbird", "Kingfisher"],
    correct: 1,
    difficulty: "easy"
  },
  {
    id: 47,
    question: "Which animal can sleep with one eye open?",
    options: ["Whale", "Dolphin", "Crocodile"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 48,
    question: "What animal has the largest brain?",
    options: ["Elephant", "Whale", "Gorilla"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 49,
    question: "Which animal is famous for playing dead when threatened?",
    options: ["Dog", "Opossum", "Otter"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 50,
    question: "Which dog breed has a blue-black tongue?",
    options: ["Husky", "Bulldog", "Chow Chow"],
    correct: 2,
    difficulty: "hard"
  },
  {
    id: 51,
    question: "Which shark is the biggest?",
    options: ["Tiger shark", "Whale shark", "Great white shark"],
    correct: 1,
    difficulty: "medium"
  },
  {
    id: 52,
    question: "What is the only bird with nostrils at the end of its beak?",
    options: ["Kiwi", "Robin", "Crane"],
    correct: 0,
    difficulty: "hard"
  },
  {
    id: 53,
    question: "Which bird can mimic chainsaws and car alarms?",
    options: ["Parrot", "Lyrebird", "Mockingbird"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 54,
    question: "Which mammal has the densest fur?",
    options: ["Polar bear", "Sea otter", "Musk ox"],
    correct: 1,
    difficulty: "hard"
  },
  {
    id: 55,
    question: "Which animal walks sideways?",
    options: ["Crab", "Otter", "Penguin"],
    correct: 0,
    difficulty: "easy"
  },
  {
    id: 56,
    question: "What reptile can run across water?",
    options: ["Basilisk lizard", "Snake", "Chameleon"],
    correct: 0,
    difficulty: "hard"
  },
  {
    id: 57,
    question: "Which animal has blue blood?",
    options: ["Crab", "Lobster", "Octopus"],
    correct: 2,
    difficulty: "hard"
  },
  {
    id: 58,
    question: "Which insect is the best-known pollinator of crops?",
    options: ["Beetle", "Mosquito", "Honeybee"],
    correct: 2,
    difficulty: "easy"
  },
  {
    id: 59,
    question: "What is a group of frogs called?",
    options: ["Army", "Troop", "Flock"],
    correct: 0,
    difficulty: "medium"
  },
  {
    id: 60,
    question: "Which animal can sleep for three years?",
    options: ["Sloth", "Snail", "Bear"],
    correct: 1,
    difficulty: "hard"
  }
];

type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
type GameState = 'menu' | 'playing' | 'results';

interface AnimalTriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
}

export default function AnimalTrivia() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<AnimalTriviaQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showAnswer) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing' && !showAnswer) {
      handleTimeUp();
    }
  }, [timeLeft, gameState, showAnswer]);

  // Filter questions by difficulty
  const getQuestionsByDifficulty = (difficulty: Difficulty): AnimalTriviaQuestion[] => {
    if (difficulty === 'mixed') {
      // Get questions from each difficulty
      const easy = animalTriviaQuestions.filter(q => q.difficulty === 'easy').slice(0, 4);
      const medium = animalTriviaQuestions.filter(q => q.difficulty === 'medium').slice(0, 4);
      const hard = animalTriviaQuestions.filter(q => q.difficulty === 'hard').slice(0, 2);
      return [...easy, ...medium, ...hard].sort(() => Math.random() - 0.5);
    }
    return animalTriviaQuestions.filter(q => q.difficulty === difficulty);
  };

  // Start game
  const startGame = () => {
    const questions = getQuestionsByDifficulty(selectedDifficulty);
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
    
    setGameQuestions(shuffledQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(30);
    setGameStartTime(Date.now());
    setShowAnswer(false);
    setLastAnswerCorrect(null);
    setSelectedAnswer(null);
    setGameState('playing');
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = gameQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;
    
    setLastAnswerCorrect(isCorrect);
    setShowAnswer(true);

    if (isCorrect) {
      const timeBonus = Math.max(0, timeLeft * 2);
      const difficultyMultiplier = currentQuestion.difficulty === 'easy' ? 1 : currentQuestion.difficulty === 'medium' ? 1.5 : 2;
      
      // Bonus multiplier based on how many questions they've answered correctly so far
      const newCorrectCount = correctAnswers + 1;
      const streakMultiplier = 1 + (newCorrectCount * 0.2); // 20% bonus per correct answer
      
      const basePoints = (100 + timeBonus) * difficultyMultiplier;
      const points = Math.round(basePoints * streakMultiplier);
      
      setScore(prev => prev + points);
      setCorrectAnswers(prev => prev + 1);
      
      toast({
        title: "Correct! 🎉",
        description: `+${points} points ${newCorrectCount > 1 ? `(${newCorrectCount}x streak bonus!)` : ''}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Incorrect",
        description: `The answer was: ${currentQuestion.options[currentQuestion.correct]}`,
        variant: "destructive",
      });
    }
  };

  // Handle time up
  const handleTimeUp = () => {
    if (selectedAnswer !== null) {
      handleSubmitAnswer();
    } else {
      setLastAnswerCorrect(false);
      setShowAnswer(true);
      
      const currentQuestion = gameQuestions[currentQuestionIndex];
      toast({
        title: "Time's up!",
        description: `The answer was: ${currentQuestion.options[currentQuestion.correct]}`,
        variant: "destructive",
      });
    }
  };

  // Submit animal trivia completion to server
  const submitAnimalTriviaCompletion = async () => {
    if (!user) return;

    try {
      const completionData = {
        userId: user.id,
        score: Math.max(0, score),
        correctAnswers,
        totalQuestions: gameQuestions.length,
        timeToComplete: gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : undefined
      };

      await apiRequest('POST', '/api/animal-trivia/complete', completionData);
      
      toast({
        title: "Game Saved! 🎉",
        description: `Your score of ${Math.max(0, score)} points has been added to the leaderboard!`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting animal trivia completion:', error);
      toast({
        title: "Score not saved",
        description: "There was an issue saving your score, but you can still see your results!",
        variant: "destructive",
      });
    }
  };

  // Go to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setShowAnswer(false);
      setLastAnswerCorrect(null);
    } else {
      setGameState('results');
      // Submit completion data when game finishes
      submitAnimalTriviaCompletion();
    }
  };

  // Reset game
  const resetGame = () => {
    setGameState('menu');
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(30);
    setGameStartTime(null);
    setShowAnswer(false);
    setLastAnswerCorrect(null);
    setSelectedAnswer(null);
  };

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / gameQuestions.length) * 100;

  // Calculate performance
  const getPerformance = () => {
    const percentage = (correctAnswers / gameQuestions.length) * 100;
    if (percentage >= 90) return { text: "Excellent!", color: "text-green-600" };
    if (percentage >= 70) return { text: "Great job!", color: "text-blue-600" };
    if (percentage >= 50) return { text: "Good effort!", color: "text-yellow-600" };
    return { text: "Keep practicing!", color: "text-gray-600" };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🐾 Animal Trivia
        </h1>
        <p className="text-lg text-muted-foreground">
          Test your knowledge about the amazing animal kingdom!
        </p>
      </div>

      {gameState === 'menu' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Choose Your Difficulty
              </CardTitle>
              <CardDescription>
                Select how challenging you want your animal trivia questions to be
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['easy', 'medium', 'hard', 'mixed'] as Difficulty[]).map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className="h-16 text-center"
                  >
                    <div>
                      <div className="font-semibold capitalize">{difficulty}</div>
                      <div className="text-xs opacity-75">
                        {difficulty === 'easy' && '1x points'}
                        {difficulty === 'medium' && '1.5x points'}
                        {difficulty === 'hard' && '2x points'}
                        {difficulty === 'mixed' && 'Varied points'}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <Separator />
              
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Game Rules:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 10 random questions from your chosen difficulty</li>
                    <li>• 30 seconds per question</li>
                    <li>• Bonus points for quick answers</li>
                    <li>• Streak multiplier increases your score!</li>
                  </ul>
                </div>
                
                <Button onClick={startGame} size="lg" className="w-full">
                  Start Animal Trivia 🦁
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState === 'playing' && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress and Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {gameQuestions.length}
              </span>
              <Badge variant="outline" className="capitalize">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-mono text-lg ${timeLeft <= 5 ? 'text-red-500' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          {/* Score Display */}
          <div className="text-center">
            <div className="text-2xl font-bold">Score: {Math.max(0, score)}</div>
            <div className="text-sm text-muted-foreground">
              Correct: {correctAnswers} | Streak: {correctAnswers > 0 ? `${correctAnswers}x` : '0x'}
            </div>
          </div>

          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showAnswer ? (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={timeLeft === 0}
                        className={`p-4 h-auto text-left justify-start transition-all ${
                          selectedAnswer === index 
                            ? 'bg-green-600 text-white border-green-600' 
                            : 'hover:bg-green-50 hover:border-green-200'
                        }`}
                        data-testid={`option-${index}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            selectedAnswer === index 
                              ? 'bg-white text-green-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex-1 text-lg">{option}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          index === currentQuestion.correct
                            ? 'bg-green-50 border-green-200'
                            : selectedAnswer === index
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            index === currentQuestion.correct
                              ? 'bg-green-600 text-white'
                              : selectedAnswer === index
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-400 text-white'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex-1 text-lg">{option}</div>
                          <div className="flex items-center gap-1">
                            {index === currentQuestion.correct && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {selectedAnswer === index && index !== currentQuestion.correct && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${
                    lastAnswerCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {lastAnswerCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-bold text-lg">
                        {lastAnswerCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-lg"><strong>Correct Answer:</strong> {currentQuestion.options[currentQuestion.correct]}</p>
                    {selectedAnswer !== null && (
                      <p className="text-lg"><strong>Your Answer:</strong> {currentQuestion.options[selectedAnswer]}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!showAnswer && (
            <div className="flex gap-4">
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="w-full py-3 text-lg"
                data-testid="button-submit"
              >
                Submit Answer
              </Button>
            </div>
          )}
          
          {showAnswer && (
            <div className="flex gap-4">
              <Button onClick={handleNextQuestion} className="w-full py-3 text-lg" data-testid="button-next">
                {currentQuestionIndex < gameQuestions.length - 1 ? 'Next Question' : 'View Results'}
              </Button>
            </div>
          )}
        </div>
      )}

      {gameState === 'results' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Game Complete! 🎉</CardTitle>
              <CardDescription>Here's how you performed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-4xl font-bold">{Math.max(0, score)}</div>
                  <div className="text-muted-foreground">Final Score</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">{correctAnswers}</div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-red-600">{gameQuestions.length - correctAnswers}</div>
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className={`text-xl font-semibold ${getPerformance().color}`}>
                    {getPerformance().text}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((correctAnswers / gameQuestions.length) * 100)}% accuracy
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button onClick={resetGame} variant="outline" className="flex-1">
                  Play Again
                </Button>
                <Button onClick={() => window.location.href = '/'} className="flex-1">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
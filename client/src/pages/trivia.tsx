import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { ArrowLeft, Trophy, Clock, Star, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TriviaQuestion {
  question: string;
  options: string[];
  correct: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const triviaQuestions: TriviaQuestion[] = [
  // Easy Questions
  { question: "What is the capital of France?", options: ["Paris", "London", "Berlin", "Madrid"], correct: 0, difficulty: "easy" },
  { question: "What color do you get by mixing red and yellow?", options: ["Orange", "Purple", "Green", "Blue"], correct: 0, difficulty: "easy" },
  { question: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], correct: 0, difficulty: "easy" },
  { question: "Who wrote \"Romeo and Juliet\"?", options: ["William Shakespeare", "Charles Dickens", "Mark Twain", "Jane Austen"], correct: 0, difficulty: "easy" },
  { question: "How many continents are there?", options: ["Seven", "Six", "Five", "Eight"], correct: 0, difficulty: "easy" },
  { question: "Which animal is known as man's best friend?", options: ["Dog", "Cat", "Horse", "Bird"], correct: 0, difficulty: "easy" },
  { question: "What do bees produce?", options: ["Honey", "Silk", "Milk", "Oil"], correct: 0, difficulty: "easy" },
  { question: "Which Disney movie features the song \"Let It Go\"?", options: ["Frozen", "Moana", "Tangled", "Pocahontas"], correct: 0, difficulty: "easy" },
  { question: "What is the tallest mammal in the world?", options: ["Giraffe", "Elephant", "Blue Whale", "Horse"], correct: 0, difficulty: "easy" },
  { question: "Who is the US president on the $1 bill?", options: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "Benjamin Franklin"], correct: 0, difficulty: "easy" },
  { question: "What is H2O commonly known as?", options: ["Water", "Salt", "Oil", "Sugar"], correct: 0, difficulty: "easy" },
  { question: "How many sides does a triangle have?", options: ["Three", "Four", "Five", "Six"], correct: 0, difficulty: "easy" },
  { question: "What is the largest ocean in the world?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], correct: 0, difficulty: "easy" },
  { question: "What is the main ingredient in guacamole?", options: ["Avocado", "Tomato", "Onion", "Pepper"], correct: 0, difficulty: "easy" },
  { question: "What color are school buses in the United States?", options: ["Yellow", "Orange", "Red", "Blue"], correct: 0, difficulty: "easy" },
  { question: "Which continent is Egypt in?", options: ["Africa", "Asia", "Europe", "South America"], correct: 0, difficulty: "easy" },
  { question: "How many players are there on a soccer team (on the field)?", options: ["Eleven", "Ten", "Nine", "Twelve"], correct: 0, difficulty: "easy" },
  { question: "Which month has an extra day in a leap year?", options: ["February", "March", "April", "January"], correct: 0, difficulty: "easy" },
  { question: "In which sport would you use a putter?", options: ["Golf", "Tennis", "Baseball", "Basketball"], correct: 0, difficulty: "easy" },
  { question: "What is the capital of Japan?", options: ["Tokyo", "Osaka", "Kyoto", "Hiroshima"], correct: 0, difficulty: "easy" },
  { question: "What fruit is known for keeping doctors away?", options: ["Apple", "Orange", "Banana", "Grape"], correct: 0, difficulty: "easy" },
  { question: "Who was the first President of the United States?", options: ["George Washington", "Thomas Jefferson", "John Adams", "Benjamin Franklin"], correct: 0, difficulty: "easy" },
  { question: "In what year did the Titanic sink?", options: ["1912", "1914", "1910", "1915"], correct: 0, difficulty: "easy" },
  { question: "How many colors are there in a rainbow?", options: ["Seven", "Six", "Eight", "Five"], correct: 0, difficulty: "easy" },
  { question: "What gas do plants take in from the air?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: 0, difficulty: "easy" },
  { question: "What's the smallest country in the world?", options: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"], correct: 0, difficulty: "easy" },
  { question: "How many legs does a spider have?", options: ["Eight", "Six", "Ten", "Twelve"], correct: 0, difficulty: "easy" },
  { question: "Which composer wrote Beethoven's Fifth Symphony?", options: ["Ludwig van Beethoven", "Wolfgang Mozart", "Johann Bach", "Franz Schubert"], correct: 0, difficulty: "easy" },
  { question: "What is the largest organ in the human body?", options: ["Skin", "Liver", "Brain", "Heart"], correct: 0, difficulty: "easy" },
  { question: "What currency is used in Japan?", options: ["Yen", "Won", "Yuan", "Dollar"], correct: 0, difficulty: "easy" },

  // Medium Questions
  { question: "What was the first country to use postcards?", options: ["Austria", "Germany", "France", "England"], correct: 0, difficulty: "medium" },
  { question: "Which vitamin is produced when a person is exposed to sunlight?", options: ["Vitamin D", "Vitamin C", "Vitamin A", "Vitamin B"], correct: 0, difficulty: "medium" },
  { question: "What is the name for a group of lions?", options: ["Pride", "Pack", "Herd", "Flock"], correct: 0, difficulty: "medium" },
  { question: "In which country would you find the ancient city of Petra?", options: ["Jordan", "Egypt", "Syria", "Lebanon"], correct: 0, difficulty: "medium" },
  { question: "What is the world's longest river?", options: ["Nile", "Amazon", "Mississippi", "Yangtze"], correct: 0, difficulty: "medium" },
  { question: "Which scientist formulated the laws of motion and gravity?", options: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Charles Darwin"], correct: 0, difficulty: "medium" },
  { question: "Who discovered penicillin?", options: ["Alexander Fleming", "Louis Pasteur", "Marie Curie", "Robert Koch"], correct: 0, difficulty: "medium" },
  { question: "What is the currency of South Africa?", options: ["Rand", "Dollar", "Pound", "Euro"], correct: 0, difficulty: "medium" },
  { question: "Which planet is closest to the sun?", options: ["Mercury", "Venus", "Earth", "Mars"], correct: 0, difficulty: "medium" },
  { question: "What is the largest land animal?", options: ["Elephant", "Rhinoceros", "Hippopotamus", "Giraffe"], correct: 0, difficulty: "medium" },
  { question: "What is the term for animals that eat both plants and meat?", options: ["Omnivores", "Herbivores", "Carnivores", "Insectivores"], correct: 0, difficulty: "medium" },
  { question: "Which book begins with the line \"Call me Ishmael\"?", options: ["Moby-Dick", "The Great Gatsby", "To Kill a Mockingbird", "1984"], correct: 0, difficulty: "medium" },
  { question: "Who wrote \"To Kill a Mockingbird\"?", options: ["Harper Lee", "Mark Twain", "Ernest Hemingway", "F. Scott Fitzgerald"], correct: 0, difficulty: "medium" },
  { question: "Which president said, \"Speak softly and carry a big stick\"?", options: ["Theodore Roosevelt", "Franklin Roosevelt", "Abraham Lincoln", "Thomas Jefferson"], correct: 0, difficulty: "medium" },
  { question: "How many strings are there on a standard violin?", options: ["Four", "Five", "Six", "Three"], correct: 0, difficulty: "medium" },
  { question: "What is the capital of Iceland?", options: ["Reykjavik", "Oslo", "Helsinki", "Stockholm"], correct: 0, difficulty: "medium" },
  { question: "What is the currency of Sweden?", options: ["Krona", "Euro", "Pound", "Dollar"], correct: 0, difficulty: "medium" },
  { question: "Which element is a liquid at room temperature?", options: ["Mercury", "Lead", "Aluminum", "Copper"], correct: 0, difficulty: "medium" },
  { question: "What is the largest moon of Jupiter?", options: ["Ganymede", "Europa", "Io", "Callisto"], correct: 0, difficulty: "medium" },
  { question: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Cu", "Fe"], correct: 0, difficulty: "medium" },

  // Hard Questions
  { question: "What is the specific term for fear of spiders?", options: ["Arachnophobia", "Acrophobia", "Claustrophobia", "Agoraphobia"], correct: 0, difficulty: "hard" },
  { question: "Which country was formerly known as Ceylon?", options: ["Sri Lanka", "Myanmar", "Thailand", "Bangladesh"], correct: 0, difficulty: "hard" },
  { question: "What is the term used for a number that is not prime and has more than two factors?", options: ["Composite number", "Complex number", "Irrational number", "Perfect number"], correct: 0, difficulty: "hard" },
  { question: "In mathematics, what is the next prime number after 47?", options: ["53", "49", "51", "55"], correct: 0, difficulty: "hard" },
  { question: "What is the scientific term for the \"little brain\" at the base of the brain?", options: ["Cerebellum", "Cerebrum", "Brain stem", "Hypothalamus"], correct: 0, difficulty: "hard" },
  { question: "Which is the only country named after a woman?", options: ["St. Lucia", "Georgia", "Virginia", "Mariland"], correct: 0, difficulty: "hard" },
  { question: "How many species of zebra are there?", options: ["Three", "Two", "Four", "Five"], correct: 0, difficulty: "hard" },
  { question: "When were the first Dead Sea Scrolls discovered?", options: ["1947", "1945", "1950", "1943"], correct: 0, difficulty: "hard" },
  { question: "What is the longest-running Broadway show in history?", options: ["The Phantom of the Opera", "Cats", "Chicago", "The Lion King"], correct: 0, difficulty: "hard" },
  { question: "What color is an airplane's black box?", options: ["Orange", "Black", "Red", "Yellow"], correct: 0, difficulty: "hard" },
  { question: "How many time zones are located in France?", options: ["12", "8", "6", "10"], correct: 0, difficulty: "hard" },
  { question: "What is the world's oldest toy?", options: ["Stick", "Ball", "Doll", "Top"], correct: 0, difficulty: "hard" },
  { question: "What is the term for a sandstorm with strong winds and dust?", options: ["Haboob", "Sirocco", "Monsoon", "Typhoon"], correct: 0, difficulty: "hard" },
  { question: "In what year did Serena Williams win her first Grand Slam singles title?", options: ["1999", "1998", "2000", "2001"], correct: 0, difficulty: "hard" }
];

type GameState = 'menu' | 'playing' | 'finished';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export default function TriviaPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<TriviaQuestion[]>([]);
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
  const getQuestionsByDifficulty = (difficulty: Difficulty): TriviaQuestion[] => {
    if (difficulty === 'mixed') {
      // Get 5 questions from each difficulty
      const easy = triviaQuestions.filter(q => q.difficulty === 'easy').slice(0, 5);
      const medium = triviaQuestions.filter(q => q.difficulty === 'medium').slice(0, 5);
      const hard = triviaQuestions.filter(q => q.difficulty === 'hard').slice(0, 5);
      return [...easy, ...medium, ...hard].sort(() => Math.random() - 0.5);
    }
    return triviaQuestions.filter(q => q.difficulty === difficulty);
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
    setLastAnswerCorrect(false);
    setShowAnswer(true);
    
    toast({
      title: "Time's up!",
      description: `The answer was: ${gameQuestions[currentQuestionIndex].options[gameQuestions[currentQuestionIndex].correct]}`,
      variant: "destructive",
    });
  };

  // Submit trivia completion to server
  const submitTriviaCompletion = async () => {
    if (!user) return;

    try {
      const completionData = {
        userId: user.id,
        score: Math.max(0, score),
        correctAnswers,
        totalQuestions: gameQuestions.length,
        timeToComplete: gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : undefined
      };

      await apiRequest('POST', '/api/trivia/complete', completionData);
      
      toast({
        title: "Game Saved! 🎉",
        description: `Your score of ${Math.max(0, score)} points has been added to the leaderboard!`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting trivia completion:', error);
      toast({
        title: "Score not saved",
        description: "There was an issue saving your score, but you can still see your results!",
        variant: "destructive",
      });
    }
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setShowAnswer(false);
      setLastAnswerCorrect(null);
    } else {
      setGameState('finished');
      // Submit completion data when game finishes
      submitTriviaCompletion();
    }
  };

  // Reset game
  const resetGame = () => {
    setGameState('menu');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(30);
    setShowAnswer(false);
    setLastAnswerCorrect(null);
  };

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / gameQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-indigo-800">🧠 Trivia Challenge</h1>
        </div>

        {/* Game Menu */}
        {gameState === 'menu' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Choose Your Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
                    className="p-6 h-auto"
                    onClick={() => setSelectedDifficulty('easy')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🟢</div>
                      <div className="font-bold">Easy</div>
                      <div className="text-sm opacity-75">Basic knowledge questions</div>
                    </div>
                  </Button>

                  <Button
                    variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
                    className="p-6 h-auto"
                    onClick={() => setSelectedDifficulty('medium')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🟡</div>
                      <div className="font-bold">Medium</div>
                      <div className="text-sm opacity-75">Intermediate challenges</div>
                    </div>
                  </Button>

                  <Button
                    variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
                    className="p-6 h-auto"
                    onClick={() => setSelectedDifficulty('hard')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔴</div>
                      <div className="font-bold">Hard</div>
                      <div className="text-sm opacity-75">Expert level trivia</div>
                    </div>
                  </Button>

                  <Button
                    variant={selectedDifficulty === 'mixed' ? 'default' : 'outline'}
                    className="p-6 h-auto"
                    onClick={() => setSelectedDifficulty('mixed')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎲</div>
                      <div className="font-bold">Mixed</div>
                      <div className="text-sm opacity-75">All difficulty levels</div>
                    </div>
                  </Button>
                </div>

                <Button onClick={startGame} className="w-full py-6 text-lg" size="lg">
                  <Star className="w-5 h-5 mr-2" />
                  Start Trivia Game
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-4">Game Rules:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Answer 10 random questions from your chosen difficulty</li>
                  <li>• You have 30 seconds per question</li>
                  <li>• Faster answers earn more bonus points</li>
                  <li>• Harder questions are worth more points</li>
                  <li>• Mixed mode includes questions from all difficulties</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Playing */}
        {gameState === 'playing' && currentQuestion && (
          <div className="space-y-6">
            {/* Progress and Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Question {currentQuestionIndex + 1} of {gameQuestions.length}
                  </Badge>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className={`font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {timeLeft}s
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold text-indigo-600">{score} pts</span>
                    </div>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Badge 
                    className={`${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {currentQuestion.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
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
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'hover:bg-indigo-50 hover:border-indigo-200'
                          }`}
                          data-testid={`option-${index}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                              selectedAnswer === index 
                                ? 'bg-white text-indigo-600' 
                                : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1 text-lg">{option}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null || timeLeft === 0}
                      className="w-full py-3 text-lg"
                      data-testid="button-submit"
                    >
                      Submit Answer
                    </Button>
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
                    <Button onClick={nextQuestion} className="w-full py-3 text-lg" data-testid="button-next">
                      {currentQuestionIndex < gameQuestions.length - 1 ? 'Next Question' : 'Finish Game'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Finished */}
        {gameState === 'finished' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">🎉 Game Complete!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{score}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{correctAnswers}/{gameQuestions.length}</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">Performance Rating:</h3>
                  <div className="text-lg">
                    {correctAnswers >= 9 ? '🏆 Outstanding!' :
                     correctAnswers >= 7 ? '🥇 Excellent!' :
                     correctAnswers >= 5 ? '🥈 Good Job!' :
                     correctAnswers >= 3 ? '🥉 Not Bad!' :
                     '📚 Keep Learning!'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={resetGame} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
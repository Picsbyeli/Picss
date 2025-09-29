import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Calculator, Atom, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const schoolTriviaQuestions = {
  math: {
    elementary: [
      { question: "What is 5 + 3?", options: ["7", "8", "9"], correct: 1 },
      { question: "How many sides does a triangle have?", options: ["2", "3", "4"], correct: 1 },
      { question: "What is 10 - 4?", options: ["5", "6", "7"], correct: 1 },
      { question: "How many minutes are in an hour?", options: ["50", "60", "70"], correct: 1 },
      { question: "What is 6 × 2?", options: ["10", "12", "14"], correct: 1 },
    ],
    middle: [
      { question: "What is 12²?", options: ["124", "144", "154"], correct: 1 },
      { question: "What is the area of a rectangle with length 8 and width 5?", options: ["30", "40", "50"], correct: 1 },
      { question: "What is 25% of 80?", options: ["15", "20", "25"], correct: 1 },
      { question: "What is the square root of 64?", options: ["6", "8", "10"], correct: 1 },
      { question: "What is 3/4 as a decimal?", options: ["0.75", "0.25", "0.5"], correct: 0 },
    ],
    high: [
      { question: "What is the derivative of x²?", options: ["x", "2x", "x²"], correct: 1 },
      { question: "What is sin(90°)?", options: ["0", "1", "√2/2"], correct: 1 },
      { question: "What is log₁₀(100)?", options: ["1", "2", "10"], correct: 1 },
      { question: "What is cos(60°)?", options: ["1/2", "√3/2", "√2/2"], correct: 0 },
      { question: "What is the value of π (approximately)?", options: ["3.14", "3.15", "3.16"], correct: 0 },
    ]
  },
  science: {
    elementary: [
      { question: "How many legs does an insect have?", options: ["4", "6", "8"], correct: 1 },
      { question: "What do plants need to make food?", options: ["Water only", "Sunlight and water", "Soil only"], correct: 1 },
      { question: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars"], correct: 1 },
      { question: "What gas do plants give off?", options: ["Carbon dioxide", "Oxygen", "Nitrogen"], correct: 1 },
      { question: "How many chambers does a human heart have?", options: ["2", "3", "4"], correct: 2 },
    ],
    middle: [
      { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "O2"], correct: 0 },
      { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome"], correct: 1 },
      { question: "What is the atomic number of carbon?", options: ["5", "6", "7"], correct: 1 },
      { question: "What force keeps planets in orbit?", options: ["Magnetism", "Gravity", "Friction"], correct: 1 },
      { question: "What is the pH of pure water?", options: ["6", "7", "8"], correct: 1 },
    ],
    high: [
      { question: "What is Avogadro's number?", options: ["6.02 × 10²³", "6.02 × 10²²", "6.02 × 10²⁴"], correct: 0 },
      { question: "What is DNA's complementary base to Adenine?", options: ["Guanine", "Thymine", "Cytosine"], correct: 1 },
      { question: "What is the chemical formula for glucose?", options: ["C6H12O6", "C12H22O11", "C2H6O"], correct: 0 },
      { question: "What organelle contains chlorophyll?", options: ["Mitochondria", "Chloroplast", "Nucleus"], correct: 1 },
      { question: "What is the charge of a proton?", options: ["Negative", "Positive", "Neutral"], correct: 1 },
    ]
  },
  english: {
    elementary: [
      { question: "What is a noun?", options: ["Action word", "Person, place, or thing", "Describing word"], correct: 1 },
      { question: "What is a verb?", options: ["Action word", "Person, place, or thing", "Describing word"], correct: 0 },
      { question: "How many letters are in the alphabet?", options: ["24", "25", "26"], correct: 2 },
      { question: "What is an adjective?", options: ["Action word", "Person, place, or thing", "Describing word"], correct: 2 },
      { question: "What punctuation ends a question?", options: ["Period", "Question mark", "Exclamation point"], correct: 1 },
    ],
    middle: [
      { question: "What is a metaphor?", options: ["Direct comparison using 'like' or 'as'", "Indirect comparison", "Exaggeration"], correct: 1 },
      { question: "What is alliteration?", options: ["Repetition of vowel sounds", "Repetition of consonant sounds", "Rhyming words"], correct: 1 },
      { question: "What is the subject in 'The dog ran quickly'?", options: ["dog", "ran", "quickly"], correct: 0 },
      { question: "What is personification?", options: ["Giving human qualities to non-human things", "Comparing two things", "Exaggerating"], correct: 0 },
      { question: "What part of speech is 'quickly'?", options: ["Noun", "Verb", "Adverb"], correct: 2 },
    ],
    high: [
      { question: "What is iambic pentameter?", options: ["5 feet of unstressed-stressed syllables", "4 feet of stressed-unstressed syllables", "6 feet of unstressed-stressed syllables"], correct: 0 },
      { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain"], correct: 1 },
      { question: "What is a thesis statement?", options: ["Concluding sentence", "Main argument", "Supporting detail"], correct: 1 },
      { question: "What is dramatic irony?", options: ["Audience knows more than characters", "Opposite of what's expected", "Exaggeration"], correct: 0 },
      { question: "What is symbolism?", options: ["Using objects to represent ideas", "Repeating words", "Comparing things"], correct: 0 },
    ]
  },
  history: {
    elementary: [
      { question: "Who was the first President of the United States?", options: ["Abraham Lincoln", "George Washington", "Thomas Jefferson"], correct: 1 },
      { question: "What holiday celebrates American independence?", options: ["Memorial Day", "4th of July", "Labor Day"], correct: 1 },
      { question: "What ocean did Columbus cross to reach America?", options: ["Pacific", "Atlantic", "Indian"], correct: 1 },
      { question: "Who was the 16th President?", options: ["George Washington", "Abraham Lincoln", "Theodore Roosevelt"], correct: 1 },
      { question: "What war was fought between North and South?", options: ["Revolutionary War", "Civil War", "World War I"], correct: 1 },
    ],
    middle: [
      { question: "What year did World War II end?", options: ["1944", "1945", "1946"], correct: 1 },
      { question: "Who wrote the Declaration of Independence?", options: ["George Washington", "Thomas Jefferson", "Benjamin Franklin"], correct: 1 },
      { question: "What was the first permanent English settlement?", options: ["Plymouth", "Jamestown", "Boston"], correct: 1 },
      { question: "What amendment gave women the right to vote?", options: ["18th", "19th", "20th"], correct: 1 },
      { question: "What purchase doubled the size of the U.S.?", options: ["Alaska Purchase", "Louisiana Purchase", "Gadsden Purchase"], correct: 1 },
    ],
    high: [
      { question: "What treaty ended World War I?", options: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Ghent"], correct: 0 },
      { question: "Who was the first Secretary of the Treasury?", options: ["Thomas Jefferson", "Alexander Hamilton", "John Adams"], correct: 1 },
      { question: "What doctrine warned European powers against colonizing the Americas?", options: ["Truman Doctrine", "Monroe Doctrine", "Eisenhower Doctrine"], correct: 1 },
      { question: "What Supreme Court case established judicial review?", options: ["Marbury v. Madison", "Brown v. Board", "Plessy v. Ferguson"], correct: 0 },
      { question: "What act led to the Boston Tea Party?", options: ["Stamp Act", "Tea Act", "Sugar Act"], correct: 1 },
    ]
  }
};

type Subject = keyof typeof schoolTriviaQuestions;
type Grade = 'elementary' | 'middle' | 'high';

export default function SchoolTrivia() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('math');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('elementary');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const { toast } = useToast();

  const currentQuestions = schoolTriviaQuestions[selectedSubject][selectedGrade];
  const totalQuestions = Math.min(5, currentQuestions.length);

  const getSubjectIcon = (subject: Subject) => {
    switch (subject) {
      case 'math': return Calculator;
      case 'science': return Atom;
      case 'english': return BookOpen;
      case 'history': return Globe;
      default: return BookOpen;
    }
  };

  const getGradeName = (grade: Grade) => {
    switch (grade) {
      case 'elementary': return 'K-4th Grade';
      case 'middle': return '5th-8th Grade';
      case 'high': return 'High School';
    }
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setGameActive(true);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
  };

  const selectAnswer = (answerIndex: number) => {
    if (!gameActive || showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    const question = currentQuestions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;
    
    if (isCorrect) {
      const points = selectedGrade === 'high' ? 15 : selectedGrade === 'middle' ? 10 : 5;
      setScore(score + points);
      setCorrectAnswers(correctAnswers + 1);
      toast({
        title: "Correct!",
        description: `Great job! +${points} points`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: `The correct answer was: ${question.options[question.correct]}`,
        variant: "destructive",
      });
    }

    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 >= totalQuestions) {
      setGameOver(true);
      setGameActive(false);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <GraduationCap className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">School Trivia</h1>
            <p className="text-xl md:text-2xl opacity-90">
              Test your knowledge across Math, Science, English & History
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {!gameActive && !gameOver && (
          <>
            {/* Subject Selection */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Choose Subject</CardTitle>
                <CardDescription>Select the subject you want to be quizzed on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.keys(schoolTriviaQuestions) as Subject[]).map(subject => {
                    const Icon = getSubjectIcon(subject);
                    return (
                      <Button
                        key={subject}
                        variant={selectedSubject === subject ? "default" : "outline"}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <Icon className="h-6 w-6" />
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Grade Selection */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Choose Grade Level</CardTitle>
                <CardDescription>Select your preferred difficulty level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['elementary', 'middle', 'high'] as Grade[]).map(grade => (
                    <Button
                      key={grade}
                      variant={selectedGrade === grade ? "default" : "outline"}
                      className="h-16"
                      onClick={() => setSelectedGrade(grade)}
                    >
                      {getGradeName(grade)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Start Quiz */}
            <div className="text-center">
              <Button size="lg" onClick={startQuiz}>
                Start {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)} Quiz
                ({getGradeName(selectedGrade)})
              </Button>
            </div>
          </>
        )}

        {gameActive && !gameOver && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Question {currentQuestion + 1} of {totalQuestions}
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Score: {score}</p>
                  <p className="text-sm text-gray-500">
                    {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)} • {getGradeName(selectedGrade)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-xl font-medium">
                  {currentQuestions[currentQuestion].question}
                </h3>
                
                <div className="space-y-3">
                  {currentQuestions[currentQuestion].options.map((option, index) => {
                    let buttonClass = "w-full justify-start p-4 h-auto text-left transition-all duration-200 transform hover:scale-105";
                    
                    if (showResult) {
                      if (index === currentQuestions[currentQuestion].correct) {
                        buttonClass += " bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
                      } else if (index === selectedAnswer && selectedAnswer !== currentQuestions[currentQuestion].correct) {
                        buttonClass += " bg-red-100 border-red-500 text-red-800 hover:bg-red-100";
                      } else {
                        buttonClass += " opacity-50";
                      }
                    } else if (selectedAnswer === index) {
                      buttonClass += " bg-blue-100 border-blue-500 text-blue-800";
                    } else {
                      buttonClass += " border-gray-300 hover:border-blue-300 hover:bg-blue-50";
                    }
                    
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={buttonClass}
                        onClick={() => selectAnswer(index)}
                        disabled={showResult}
                      >
                        <span className="flex items-center">
                          <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-3 text-sm font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                          {showResult && index === currentQuestions[currentQuestion].correct && (
                            <span className="ml-auto text-green-600">✓</span>
                          )}
                          {showResult && index === selectedAnswer && selectedAnswer !== currentQuestions[currentQuestion].correct && (
                            <span className="ml-auto text-red-600">✗</span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  {!showResult ? (
                    <Button 
                      onClick={submitAnswer}
                      disabled={selectedAnswer === null}
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion}>
                      {currentQuestion + 1 >= totalQuestions ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameOver && (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
              <div className="space-y-2 mb-6">
                <p className="text-lg"><strong>Subject:</strong> {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}</p>
                <p className="text-lg"><strong>Grade Level:</strong> {getGradeName(selectedGrade)}</p>
                <p className="text-lg"><strong>Score:</strong> {score} points</p>
                <p className="text-lg"><strong>Correct:</strong> {correctAnswers}/{totalQuestions} ({Math.round((correctAnswers / totalQuestions) * 100)}%)</p>
              </div>
              
              <div className="mb-6">
                {correctAnswers >= totalQuestions * 0.8 ? (
                  <div className="text-green-600">
                    <h3 className="text-xl font-bold">🎓 Excellent Work!</h3>
                    <p>Outstanding academic performance!</p>
                  </div>
                ) : correctAnswers >= totalQuestions * 0.6 ? (
                  <div className="text-blue-600">
                    <h3 className="text-xl font-bold">📚 Good Job!</h3>
                    <p>Keep up the great work!</p>
                  </div>
                ) : (
                  <div className="text-orange-600">
                    <h3 className="text-xl font-bold">📖 Keep Studying!</h3>
                    <p>Try again to improve your score!</p>
                  </div>
                )}
              </div>

              <Button onClick={resetGame}>
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
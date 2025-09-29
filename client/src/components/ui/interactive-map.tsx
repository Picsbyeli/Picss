import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, MapPin, Star, Trophy, Lightbulb, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { USStatesMap } from './us-states-map';

interface GeoRegion {
  id: number;
  mapId: number;
  name: string;
  fullName?: string;
  code: string;
  capital?: string;
  svgPath?: string;
  createdAt: string;
}

interface GeoMapWithRegions {
  id: number;
  name: string;
  key: string;
  description?: string;
  svgContent?: string;
  totalRegions: number;
  isActive: boolean;
  createdAt: string;
  regions: GeoRegion[];
}

interface InteractiveMapProps {
  map: GeoMapWithRegions;
  onGameComplete: (results: GameResults) => void;
}

interface GameResults {
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  streakBonus: number;
  hintsUsed: number;
  percentage: number;
}

export function InteractiveMap({ map, onGameComplete }: InteractiveMapProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTargetRegion, setCurrentTargetRegion] = useState<GeoRegion | null>(null);
  const [correctStates, setCorrectStates] = useState<Set<string>>(new Set());
  const [incorrectStates, setIncorrectStates] = useState<Set<string>>(new Set());
  const [remainingRegions, setRemainingRegions] = useState<GeoRegion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeStarted, setTimeStarted] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    if (!gameStarted || showResults) return;

    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - timeStarted);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, showResults, timeStarted]);

  const startGame = () => {
    setGameStarted(true);
    setTimeStarted(Date.now());
    setCorrectStates(new Set());
    setIncorrectStates(new Set());
    setRemainingRegions([...map.regions]);
    setHintsUsed(0);
    setCurrentStreak(0);
    setShowResults(false);
    setShowHint(false);
    
    // Pick first target region randomly
    const shuffled = [...map.regions].sort(() => Math.random() - 0.5);
    setCurrentTargetRegion(shuffled[0]);
    setRemainingRegions(shuffled.slice(1));
  };

  const handleStateClick = (stateCode: string, stateName: string) => {
    if (!currentTargetRegion || showResults || !gameStarted) return;

    const isCorrect = currentTargetRegion.code === stateCode || 
                     currentTargetRegion.name.toLowerCase() === stateName.toLowerCase();

    if (isCorrect) {
      // Correct answer
      setCorrectStates(prev => new Set([...Array.from(prev), stateCode]));
      setCurrentStreak(currentStreak + 1);
      
      toast({
        title: "Correct! ✅",
        description: `${currentTargetRegion.name} is correct!`,
        duration: 2000,
      });

      // Move to next region or finish
      if (remainingRegions.length > 0) {
        const nextRegion = remainingRegions[0];
        setCurrentTargetRegion(nextRegion);
        setRemainingRegions(remainingRegions.slice(1));
        setShowHint(false);
      } else {
        finishGame();
      }
    } else {
      // Incorrect answer
      setIncorrectStates(prev => new Set([...Array.from(prev), stateCode]));
      setCurrentStreak(0);
      
      toast({
        title: "Not quite right ❌",
        description: `That's ${stateName}. Try again for ${currentTargetRegion.name}!`,
        duration: 3000,
      });
    }
  };

  const useHint = () => {
    if (!currentTargetRegion) return;

    setHintsUsed(hintsUsed + 1);
    setShowHint(true);
    toast({
      title: "Hint Used! 💡",
      description: `Capital: ${currentTargetRegion.capital}`,
      duration: 3000,
    });
  };

  const skipRegion = () => {
    if (!currentTargetRegion) return;

    // Mark as incorrect and move to next
    setIncorrectStates(prev => new Set([...Array.from(prev), currentTargetRegion.code]));
    setCurrentStreak(0);
    
    toast({
      title: "Skipped ⏭️",
      description: `That was ${currentTargetRegion.name}`,
      duration: 2000,
    });

    if (remainingRegions.length > 0) {
      const nextRegion = remainingRegions[0];
      setCurrentTargetRegion(nextRegion);
      setRemainingRegions(remainingRegions.slice(1));
      setShowHint(false);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    const totalTime = Math.floor((Date.now() - timeStarted) / 1000);
    
    // Calculate results based on correct/incorrect states
    const correctCount = correctStates.size;
    const incorrectCount = incorrectStates.size;
    
    // Calculate streak bonus based on correct answers
    let streakBonus = 0;
    if (correctCount >= 5) {
      streakBonus = Math.floor(correctCount / 5) * 25;
    }

    const baseScore = correctCount * 10;
    const timeBonus = Math.max(0, Math.floor((3600 - Math.min(totalTime, 3600)) / 72));
    const hintPenalty = hintsUsed * 5;
    const totalScore = Math.max(0, baseScore + streakBonus + timeBonus - hintPenalty);
    const maxScore = map.regions.length * 10 + 50;
    const percentage = Math.round((correctCount / map.regions.length) * 100);

    const results: GameResults = {
      score: totalScore,
      maxScore,
      correctAnswers: correctCount,
      totalQuestions: map.regions.length,
      timeSpent: totalTime,
      streakBonus,
      hintsUsed,
      percentage
    };

    setShowResults(true);
    onGameComplete(results);

    // Celebration effect
    if (percentage >= 90) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (percentage >= 70) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto" data-testid="card-geography-start">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-map-title">{map.name}</CardTitle>
          <p className="text-muted-foreground" data-testid="text-map-description">
            {map.description}
          </p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary" data-testid="badge-total-regions">
              {map.totalRegions} Regions
            </Badge>
            <Badge variant="secondary" data-testid="badge-time-limit">
              60 minute time limit
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={startGame} 
            size="lg" 
            className="w-full"
            data-testid="button-start-game"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Start Geography Challenge
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    return (
      <Card className="w-full max-w-4xl mx-auto" data-testid="card-results">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-results-title">
            Geography Challenge Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Map with Results */}
          <USStatesMap
            correctStates={correctStates}
            incorrectStates={incorrectStates}
            onStateClick={() => {}} // Disabled after game
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="text-final-score">
                {correctStates.size}/{map.totalRegions}
              </div>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600" data-testid="text-percentage">
                {Math.round((correctStates.size / map.totalRegions) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time:</span>
              <span data-testid="text-final-time">{formatTime(Math.floor(timeElapsed / 1000))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hints Used:</span>
              <span data-testid="text-hints-used">{hintsUsed}</span>
            </div>
          </div>

          <Button 
            onClick={startGame} 
            className="w-full"
            data-testid="button-play-again"
          >
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = correctStates.size / map.regions.length * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="card-geography-game">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg" data-testid="text-game-title">
            Geography Challenge
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1" data-testid="text-timer">
              <Timer className="h-4 w-4" />
              {formatTime(Math.floor(timeElapsed / 1000))}
            </div>
            <div className="flex items-center gap-1" data-testid="text-streak">
              <Star className="h-4 w-4" />
              {currentStreak}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span data-testid="text-progress">
              {correctStates.size} of {map.regions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Target State Question */}
        {currentTargetRegion && (
          <div className="text-center bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2" data-testid="text-target-state">
              Click on: {currentTargetRegion.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Find and click on {currentTargetRegion.name} in the map below
            </p>
            {currentTargetRegion.capital && (
              <p className="text-sm text-muted-foreground mt-1">
                ({currentTargetRegion.capital} is the capital)
              </p>
            )}
          </div>
        )}

        {/* Interactive Map */}
        <USStatesMap
          correctStates={correctStates}
          incorrectStates={incorrectStates}
          currentTargetState={currentTargetRegion?.code}
          onStateClick={handleStateClick}
        />

        {/* Hint Section */}
        {showHint && currentTargetRegion?.capital && (
          <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 text-center">
              💡 Hint: Capital is {currentTargetRegion.capital}
            </p>
          </div>
        )}

        {/* Game Controls */}
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={useHint} 
            variant="outline"
            data-testid="button-use-hint"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Hint
          </Button>
          <Button 
            onClick={skipRegion} 
            variant="outline"
            data-testid="button-skip"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
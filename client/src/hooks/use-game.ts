import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type RiddleWithCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Progressive hints for riddles
const generateProgressiveHints = (riddleQuestion: string, riddleAnswer: string, baseHint: string | null): string[] => {
  const hints = [];
  
  // First hint: Use the riddle's specific hint, or a contextual fallback
  if (baseHint) {
    hints.push(baseHint);
  } else {
    hints.push("Think about what the question is really asking.");
  }
  
  // Second hint: Give a more specific contextual clue based on the answer
  const answer = riddleAnswer.toLowerCase();
  let secondHint = "";
  
  // Generate context-aware second hints based on common answer patterns
  if (answer.includes("water") || answer.includes("ocean") || answer.includes("river")) {
    secondHint = "Think about something related to water or liquid.";
  } else if (answer.includes("time") || answer.includes("clock") || answer.includes("hour") || answer.includes("minute")) {
    secondHint = "Consider something related to time or the passage of time.";
  } else if (answer.includes("book") || answer.includes("word") || answer.includes("letter")) {
    secondHint = "Think about reading, writing, or language.";
  } else if (answer.includes("light") || answer.includes("dark") || answer.includes("shadow")) {
    secondHint = "Consider the relationship between light and darkness.";
  } else if (answer.includes("fire") || answer.includes("flame") || answer.includes("burn")) {
    secondHint = "Think about heat, fire, or burning.";
  } else if (answer.includes("cold") || answer.includes("ice") || answer.includes("snow")) {
    secondHint = "Consider something cold or frozen.";
  } else if (answer.includes("air") || answer.includes("wind") || answer.includes("breath")) {
    secondHint = "Think about air, breathing, or the wind.";
  } else if (answer.includes("door") || answer.includes("key") || answer.includes("lock")) {
    secondHint = "Consider something that opens, closes, or provides access.";
  } else if (answer.includes("mirror") || answer.includes("reflect")) {
    secondHint = "Think about reflection or seeing yourself.";
  } else if (answer.includes("heart") || answer.includes("love") || answer.includes("emotion")) {
    secondHint = "Consider feelings, emotions, or matters of the heart.";
  } else if (answer.includes("sound") || answer.includes("music") || answer.includes("sing")) {
    secondHint = "Think about sounds, music, or hearing.";
  } else if (answer.includes("hand") || answer.includes("finger") || answer.includes("touch")) {
    secondHint = "Consider something you can touch or hold.";
  } else if (answer.includes("eye") || answer.includes("see") || answer.includes("vision")) {
    secondHint = "Think about seeing, looking, or vision.";
  } else if (answer.includes("walk") || answer.includes("step") || answer.includes("path")) {
    secondHint = "Consider movement, walking, or a journey.";
  } else if (answer.includes("home") || answer.includes("house") || answer.includes("room")) {
    secondHint = "Think about places where people live or spend time.";
  } else if (answer.includes("animal") || answer.includes("dog") || answer.includes("cat") || answer.includes("bird")) {
    secondHint = "Consider a living creature or animal.";
  } else if (answer.includes("food") || answer.includes("eat") || answer.includes("hungry")) {
    secondHint = "Think about food, eating, or nourishment.";
  } else if (answer.includes("tree") || answer.includes("plant") || answer.includes("flower")) {
    secondHint = "Consider something that grows in nature.";
  } else if (answer.includes("money") || answer.includes("coin") || answer.includes("gold")) {
    secondHint = "Think about value, money, or precious things.";
  } else if (answer.includes("dream") || answer.includes("sleep") || answer.includes("night")) {
    secondHint = "Consider sleep, dreams, or nighttime.";
  } else if (answer.includes("car") || answer.includes("wheel") || answer.includes("drive")) {
    secondHint = "Think about transportation or moving from place to place.";
  } else {
    // Multiple varied fallback hints to ensure uniqueness
    const fallbackHints = [
      "Think about what type of thing this could be - is it an object, action, concept, or living thing?",
      "Consider the key words in the riddle - what do they have in common?",
      "Look for wordplay or double meanings in the question.",
      "Think about everyday things you encounter - the answer might be simpler than you think.",
      "Consider if this riddle is asking about a process, a thing, or an idea.",
      "Break down the riddle sentence by sentence - what clues stand out?",
      "Think about the context - what setting or situation does this riddle describe?",
      "Consider if there's a metaphor or comparison being made in the riddle.",
      "Look for any rhymes, patterns, or word connections in the question.",
      "Think about cause and effect - what leads to what in this riddle?"
    ];
    
    // Use the riddle's length and first character to deterministically pick a hint
    // This ensures the same riddle always gets the same hint, but different riddles get different hints
    const hintIndex = (riddleAnswer.length + riddleAnswer.charCodeAt(0)) % fallbackHints.length;
    secondHint = fallbackHints[hintIndex];
  }
  
  hints.push(secondHint);
  
  // Third hint: Length information
  hints.push(`The answer has ${riddleAnswer.length} letters.`);
  
  // Fourth hint: First letter
  hints.push(`The answer starts with '${riddleAnswer.charAt(0).toUpperCase()}'.`);
  
  // Fifth hint: Last letter  
  hints.push(`The answer ends with '${riddleAnswer.charAt(riddleAnswer.length - 1).toLowerCase()}'.`);
  
  return hints;
};

export function useGame() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentRiddle, setCurrentRiddle] = useState<RiddleWithCategory | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [progressiveHints, setProgressiveHints] = useState<string[]>([]);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0); // Attempt counter for multiple tries
  const MAX_ATTEMPTS = 3; // Allow up to 3 attempts
  const MAX_HINTS = 5; // Maximum number of hints
  
  // Modal states
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [isWrongModalOpen, setIsWrongModalOpen] = useState(false);
  
  // Game stats
  const [isSolved, setIsSolved] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [timeToSolve, setTimeToSolve] = useState(0);
  const [hasViewedAnswer, setHasViewedAnswer] = useState(false);
  
  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get user stats for the current user
  const {
    data: userStats = { score: 0, solvedCount: 0, avgTimeSeconds: 0 },
    refetch: refetchUserStats,
  } = useQuery({
    queryKey: ['/api/user', user?.id, 'stats'],
    enabled: !!user, // Only fetch when we have a user
  });
  
  // Mutation to mark a riddle as viewed (when showing the answer)
  const markRiddleViewedMutation = useMutation({
    mutationFn: async () => {
      if (!currentRiddle || !user) return null;
      
      const response = await apiRequest(
        "POST",
        "/api/mark-viewed",
        {
          riddleId: currentRiddle.id,
          userId: user.id
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      // Set local state to mark as viewed
      setHasViewedAnswer(true);
    },
    onError: (error) => {
      console.error("Error marking riddle as viewed:", error);
    }
  });
  
  // Start game
  const startGame = () => {
    setIsGameActive(true);
    setGameStartTime(Date.now());
    setIsSolved(false);
    setHintsUsed(0);
    setIsPaused(false);
    
    // Generate progressive hints when starting the game
    if (currentRiddle) {
      const hints = generateProgressiveHints(
        currentRiddle.question,
        currentRiddle.answer,
        currentRiddle.hint
      );
      setProgressiveHints(hints);
    }
  };
  
  // Reset game
  const resetGame = () => {
    setUserAnswer("");
    setHintsUsed(0);
    setProgressiveHints([]);
    setIsGameActive(false);
    setGameStartTime(null);
    setIsSolved(false);
    setPointsEarned(0);
    setCurrentHint(null);
    setTimeToSolve(0);
    setIsPaused(false);
    setAttemptCount(0); // Reset attempt counter
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Check if a new riddle is selected
  useEffect(() => {
    if (currentRiddle) {
      resetGame();
    }
  }, [currentRiddle]);
  
  // Check answer mutation
  const checkAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!currentRiddle) return null;
      
      // Calculate time to solve
      const solveTime = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
      
      // Skip API call if no user is logged in
      if (!user) {
        return null;
      }
      
      const response = await apiRequest(
        "POST",
        "/api/check-answer",
        {
          riddleId: currentRiddle.id,
          answer: userAnswer,
          userId: user.id, // Use the current logged-in user's ID
          timeToSolveSeconds: solveTime,
          hintsUsed,
          hasViewedAnswer, // Include if the user has viewed the answer previously
        }
      );
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isCorrect) {
        // Pause the game
        setIsPaused(true);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Show correct answer modal
        setIsSolved(true);
        setPointsEarned(data.pointsEarned);
        
        // Calculate time to solve
        const solveTime = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
        setTimeToSolve(solveTime);
        
        setIsCorrectModalOpen(true);
        
        // Update user stats
        refetchUserStats();
      } else {
        // Increment attempt counter
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        if (newAttemptCount >= MAX_ATTEMPTS) {
          // Pause the game after max attempts
          setIsPaused(true);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Show wrong answer modal on last attempt
          setIsWrongModalOpen(true);
          
          // Show toast for the final incorrect answer
          toast({
            title: "Maximum attempts reached",
            description: `The correct answer was "${currentRiddle?.answer}". Let's try another riddle!`,
            variant: "destructive",
          });
        } else {
          // Allow another attempt
          const attemptsLeft = MAX_ATTEMPTS - newAttemptCount;
          toast({
            title: "Incorrect answer",
            description: `Try again! You have ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error checking answer",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });
  
  // Get hint function (using progressive hints)
  const getHint = () => {
    if (!currentRiddle) return;
    
    // If game is not active, start it
    if (!isGameActive) {
      startGame();
      return;
    }
    
    // Check if we've used too many hints
    if (hintsUsed >= MAX_HINTS) {
      toast({
        title: "Maximum hints used",
        description: "You've used all available hints for this riddle!",
        variant: "destructive",
      });
      return;
    }
    
    // Get the next hint from the progressive hints array
    if (progressiveHints.length > 0 && hintsUsed < progressiveHints.length) {
      const nextHint = progressiveHints[hintsUsed];
      setCurrentHint(nextHint);
      setHintsUsed((prev) => prev + 1);
      
      toast({
        title: `Hint ${hintsUsed + 1}/${progressiveHints.length}`,
        description: nextHint,
        duration: 5000,
      });
      
      // Track hint usage for scoring (only if user is logged in)
      if (user) {
        apiRequest(
          "GET",
          `/api/hints/${currentRiddle.id}?userId=${user.id}`,
          undefined
        ).then(() => {
          // Update user stats
          refetchUserStats();
        });
      }
    } else {
      // In case we run out of hints
      toast({
        title: "No more hints",
        description: "No more hints available for this riddle!",
        variant: "destructive",
      });
    }
  };
  
  // Function to show the answer and mark it as viewed in the database
  const showAnswer = () => {
    if (!currentRiddle) return;
    
    // Pause the game
    setIsPaused(true);
    
    // Stop the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Mark this riddle as viewed in the user's progress
    if (user) {
      markRiddleViewedMutation.mutate();
    }
    
    // Set local state to show answer was viewed
    setHasViewedAnswer(true);
    
    // Toast to notify user they won't earn points
    toast({
      title: "Answer Revealed",
      description: "You won't earn points for solving this riddle now.",
      variant: "destructive",
    });
  };
  
  // Check answer function
  const checkAnswer = () => {
    if (!currentRiddle || !userAnswer.trim()) return;
    
    // If game is not active, start it
    if (!isGameActive) {
      startGame();
      return;
    }
    
    // For fair play, include hasViewedAnswer in the request
    checkAnswerMutation.mutate();
  };
  
  return {
    currentRiddle,
    setCurrentRiddle,
    userAnswer,
    setUserAnswer,
    hintsUsed,
    progressiveHints,
    isGameActive,
    isPaused,
    isCorrectModalOpen,
    setIsCorrectModalOpen,
    isWrongModalOpen,
    setIsWrongModalOpen,
    isSolved,
    pointsEarned,
    currentHint,
    timeToSolve,
    checkAnswer,
    getHint,
    resetGame,
    startGame,
    userStats,
    isCheckingAnswer: checkAnswerMutation.isPending,
    isGettingHint: false, // No longer using the mutation
    MAX_HINTS,
    // New fields for answer viewing
    showAnswer,
    hasViewedAnswer,
    setHasViewedAnswer,
    isMarkingViewed: markRiddleViewedMutation.isPending,
    // Add a blank timeLeft property for backward compatibility 
    // (we're not using it anymore, but components may reference it)
    timeLeft: 0,
    // Add attempt tracking for exhausted chances logic
    attemptCount,
    MAX_ATTEMPTS,
  };
}

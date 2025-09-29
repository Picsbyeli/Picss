import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useRiddles } from "@/hooks/use-riddles";
import { useGame } from "@/hooks/use-game";
import { useToast } from "@/hooks/use-toast";
import CurrentRiddle from "@/components/game/current-riddle";
import { CorrectAnswerModal } from "@/components/modals/correct-answer";
import { WrongAnswerModal } from "@/components/modals/wrong-answer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shuffle } from "lucide-react";
import { Link } from "wouter";

export default function CategoryPage() {
  const { toast } = useToast();
  const [match, params] = useRoute("/category/:id");
  const categoryId = params?.id ? parseInt(params.id) : null;
  
  const { 
    riddlesWithCategories, 
    categories,
    getRandomUnsolvedRiddle,
    getRiddlesByCategory,
    getUnsolvedRiddlesByCategory,
    isLoadingRiddles, 
    isLoadingCategories 
  } = useRiddles();
  
  const {
    currentRiddle,
    setCurrentRiddle,
    userAnswer,
    setUserAnswer,
    isCorrectModalOpen,
    setIsCorrectModalOpen,
    isWrongModalOpen,
    setIsWrongModalOpen,
    timeLeft,
    hintsUsed,
    pointsEarned,
    timeToSolve,
    checkAnswer,
    getHint,
    resetGame,
    userStats,
    isCheckingAnswer,
    isPaused,
    currentHint,
    showAnswer,
    attemptCount,
    MAX_ATTEMPTS
  } = useGame();

  // Find the current category
  const currentCategory = categories.find(cat => cat.id === categoryId);
  
  // Get riddles for this category
  const categoryRiddles = getRiddlesByCategory(categoryId);
  const unsolvedCategoryRiddles = getUnsolvedRiddlesByCategory(categoryId);
  
  // Initialize with a riddle from this category
  useEffect(() => {
    if (categoryId && categoryRiddles.length > 0 && !currentRiddle) {
      const newRiddle = getRandomUnsolvedRiddle(categoryId);
      if (newRiddle) {
        setCurrentRiddle(newRiddle);
        resetGame();
      }
    }
  }, [categoryId, categoryRiddles, currentRiddle, setCurrentRiddle, getRandomUnsolvedRiddle, resetGame]);

  // Handle next riddle in category - always allow progression
  const handleNextRiddle = () => {
    if (categoryRiddles.length > 0) {
      const currentIndex = categoryRiddles.findIndex(r => r.id === currentRiddle?.id);
      const nextIndex = (currentIndex + 1) % categoryRiddles.length;
      setCurrentRiddle(categoryRiddles[nextIndex]);
      resetGame();
    }
  };

  // Handle previous riddle in category  
  const handlePreviousRiddle = () => {
    if (categoryRiddles.length > 0) {
      const currentIndex = categoryRiddles.findIndex(r => r.id === currentRiddle?.id);
      const prevIndex = (currentIndex - 1 + categoryRiddles.length) % categoryRiddles.length;
      setCurrentRiddle(categoryRiddles[prevIndex]);
      resetGame();
    }
  };

  // Handle random riddle from category
  const handleRandomRiddle = () => {
    const newRiddle = getRandomUnsolvedRiddle(categoryId);
    if (newRiddle) {
      setCurrentRiddle(newRiddle);
      resetGame();
    }
  };

  if (isLoadingCategories || isLoadingRiddles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (categoryRiddles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Riddles Available</h1>
          <p className="text-gray-600 mb-6">This category doesn't have any riddles yet.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-purple-600"
              onClick={handleRandomRiddle}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Random Riddle
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {currentCategory.name}
            </h1>
            <p className="text-lg opacity-90 mb-4">
              {currentCategory.description}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <span>Total Riddles: {categoryRiddles.length}</span>
              <span>•</span>
              <span>Unsolved: {unsolvedCategoryRiddles.length}</span>
              {currentRiddle && (
                <>
                  <span>•</span>
                  <span>Current: {categoryRiddles.findIndex(r => r.id === currentRiddle.id) + 1} of {categoryRiddles.length}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Riddle */}
      <div className="container mx-auto px-4 py-8">
        {currentRiddle ? (
          <div className="max-w-4xl mx-auto">
            <CurrentRiddle 
              riddle={currentRiddle}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              onCheckAnswer={checkAnswer}
              onGetHint={getHint}
              onNextRiddle={handleNextRiddle}
              onPreviousRiddle={handlePreviousRiddle}
              timeLeft={timeLeft}
              hintsUsed={hintsUsed}
              isCheckingAnswer={isCheckingAnswer}
              isPaused={isPaused}
              riddlesCount={categoryRiddles.length}
              currentRiddleIndex={categoryRiddles.findIndex(r => r.id === currentRiddle.id) + 1}
              onShowAnswer={showAnswer}
            />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600">No riddle available. Try refreshing the page.</p>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CorrectAnswerModal
        isOpen={isCorrectModalOpen}
        onClose={() => setIsCorrectModalOpen(false)}
        riddleAnswer={currentRiddle?.answer || ""}
        explanation={currentRiddle?.explanation || ""}
        timeToSolve={timeToSolve}
        pointsEarned={pointsEarned}
        onNextRiddle={() => {
          setIsCorrectModalOpen(false);
          handleNextRiddle();
        }}
        onBackToMenu={() => {
          setIsCorrectModalOpen(false);
          resetGame();
        }}
      />
      
      <WrongAnswerModal
        isOpen={isWrongModalOpen}
        onClose={() => setIsWrongModalOpen(false)}
        userAnswer={userAnswer}
        onShowAnswer={() => {
          setIsWrongModalOpen(false);
          toast({
            title: "The answer is:",
            description: currentRiddle?.answer,
            duration: 5000
          });
        }}
        onTryAgain={() => {
          setIsWrongModalOpen(false);
          setUserAnswer("");
        }}
        onNextQuestion={() => {
          setIsWrongModalOpen(false);
          handleNextRiddle();
          toast({
            title: "Next question loaded!",
            description: "Try this new riddle instead.",
          });
        }}
        hint={currentHint || currentRiddle?.hint || "No hint available."}
        isAttemptsExhausted={attemptCount >= MAX_ATTEMPTS}
      />
    </div>
  );
}
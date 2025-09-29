import { useState, useEffect } from "react";
import { type RiddleWithCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AIHintButton from "@/components/ai/ai-hint-button";
import { FavoriteButton } from "@/components/ui/favorite-button";

type CurrentRiddleProps = {
  riddle: RiddleWithCategory;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  onCheckAnswer: () => void;
  onGetHint: () => void;
  onNextRiddle: () => void;
  onPreviousRiddle: () => void;
  timeLeft: number;
  hintsUsed: number;
  isCheckingAnswer: boolean;
  isPaused: boolean;
  riddlesCount: number;
  currentRiddleIndex: number;
  // New props for answer viewing
  onShowAnswer?: () => void; // Optional callback to show the answer
};

export default function CurrentRiddle({
  riddle,
  userAnswer,
  setUserAnswer,
  onCheckAnswer,
  onGetHint,
  onNextRiddle,
  onPreviousRiddle,
  timeLeft, // Kept for backward compatibility
  hintsUsed,
  isCheckingAnswer,
  isPaused,
  riddlesCount,
  currentRiddleIndex,
  onShowAnswer, // New callback for showing answer
}: CurrentRiddleProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Get CSS classes based on category
  // Reset showAnswer when riddle changes
  useEffect(() => {
    setShowAnswer(false);
  }, [riddle.id]);
  
  const getCategoryStyles = (categoryClass: string) => {
    switch (categoryClass) {
      case 'primary':
        return 'bg-primary/20 text-primary-foreground dark:bg-primary/30 dark:text-primary font-semibold';
      case 'secondary':
        return 'bg-secondary/20 text-secondary-foreground dark:bg-secondary/30 dark:text-secondary font-semibold';
      case 'accent':
        return 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent font-semibold';
      case 'warning':
        return 'bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-400 font-semibold';
      case 'dark':
        return 'bg-gray-800/20 text-gray-800 dark:bg-gray-300/20 dark:text-gray-300 font-semibold';
      default:
        return 'bg-primary/20 text-primary-foreground dark:bg-primary/30 dark:text-primary font-semibold';
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckAnswer();
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className={`${getCategoryStyles(riddle.category.colorClass)} text-sm font-medium px-3 py-1 rounded-full`}>
            {riddle.category.name}
          </span>
          <span className="ml-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <i className="ri-star-line mr-1"></i>
            {riddle.difficulty.charAt(0).toUpperCase() + riddle.difficulty.slice(1)}
          </span>
          
          {/* Favorite Button */}
          <div className="ml-2">
            <FavoriteButton riddleId={riddle.id} size="sm" />
          </div>
        </div>
        
        {/* Hint Counter */}
        <div className="flex items-center">
          <span className="text-dark-light text-sm mr-2">Hints Used:</span>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index}
                className={`w-3 h-3 mx-0.5 rounded-full ${index < hintsUsed ? 'bg-accent' : 'bg-light-gray'}`}
              />
            ))}
            <span className="ml-2 text-dark font-medium">{hintsUsed}/5</span>
          </div>
        </div>
      </div>
      
      {/* Riddle Content with fun, kid-friendly styling */}
      <div className="mb-6 text-center py-6">
        {/* Display image for visual riddles if available */}
        {riddle.imageUrl && (
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <img 
                src={riddle.imageUrl} 
                alt="Visual riddle" 
                className="max-w-full max-h-64 object-contain rounded-xl shadow-lg border-4 border-primary/20 transition-all duration-300 hover:scale-102"
              />
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-primary border-2 border-primary shadow-md">
                  <i className="ri-image-line mr-1.5"></i>
                  Visual Riddle
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Special handling for "all solved" message */}
        {riddle.answer === "" ? (
          <>
            <div className="my-8 p-8 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl shadow-lg">
              <div className="animate-bounce mb-4">
                <i className="ri-trophy-fill text-5xl text-yellow-500"></i>
              </div>
              <div className="celebrate">
                <h3 className="text-3xl font-bold font-poppins bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent mb-4">
                  {riddle.question}
                </h3>
              </div>
              <div className="mb-4 text-green-700">
                You've solved all the riddles in this category! Great job!
              </div>
              <button
                onClick={onNextRiddle}
                className="fun-button mt-4 px-8 py-3 bg-white text-green-700 border-2 border-green-500 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:bg-green-50"
              >
                Try Another Category
                <i className="ri-rocket-2-line ml-2"></i>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 mx-auto max-w-xl">
              <div className="relative mb-6">
                {/* Decorative elements, reduced opacity and moved further to ensure they don't obscure text */}
                <div className="absolute -top-12 -left-12 w-20 h-20 rounded-full bg-primary/5 z-0"></div>
                <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-secondary/5 z-0"></div>
                
                {/* Enhanced text visibility with both dark text and a subtle gradient background */}
                <h3 className="text-2xl font-bold font-poppins text-dark relative z-10 p-4 rounded-xl bg-white/70 shadow-sm border border-gray-100">
                  {/* Removed gradient text for better readability */}
                  {riddle.question}
                </h3>
              </div>
              
              <div className="inline-block px-4 py-2 rounded-full bg-light-gray/50 mb-2">
                <p className="text-dark-light text-sm font-medium">
                  Riddle #{currentRiddleIndex} of {riddlesCount}
                </p>
              </div>
            </div>
            
            {/* Only show for visual riddles */}
            {riddle.imageUrl && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-full inline-block px-4 py-1 mx-auto">
                <p className="text-xs text-yellow-700 font-medium">
                  <i className="ri-lightbulb-line mr-1"></i>
                  Look carefully at the visual elements in the image to solve this puzzle
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Only show answer sections, input forms and controls if this is not the "all solved" message */}
      {riddle.answer !== "" && (
        <>
          {/* Show Answer Display - More Kid-Friendly */}
          {showAnswer && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-primary/20 shadow-lg text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rotate-12 bg-primary opacity-5 rounded-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 -rotate-12 bg-secondary opacity-5 rounded-lg"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <i className="ri-magic-line text-xl text-primary"></i>
                </div>
                
                <h4 className="text-xl font-bold mb-3 text-primary">The Answer Is:</h4>
                <p className="font-bold text-2xl mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {riddle.answer}
                </p>
                
                {riddle.explanation && (
                  <div className="mt-4 pt-4 border-t border-primary/10">
                    <h5 className="text-sm font-bold text-dark-light mb-2">
                      <i className="ri-lightbulb-flash-line mr-1"></i>
                      Explanation:
                    </h5>
                    <p className="text-dark-light text-sm bg-white/50 p-3 rounded-xl">
                      {riddle.explanation}
                    </p>
                  </div>
                )}
                
                {/* Next Question Button after showing answer */}
                <div className="mt-6 pt-4 border-t border-primary/10">
                  <button 
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white flex items-center px-6 py-3 rounded-full font-bold shadow-lg transition transform duration-200 hover:scale-105 mx-auto"
                    onClick={onNextRiddle}
                  >
                    <i className="ri-arrow-right-circle-line mr-2 text-lg"></i>
                    Next Question
                    <i className="ri-sparkle-line ml-2 text-lg"></i>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Try another riddle from this category
                  </p>
                </div>
              </div>
            </div>
          )}
    
          {/* Answer Input - More Fun and Kid-Friendly */}
          <form onSubmit={handleSubmit} className="mb-8 max-w-xl mx-auto">
            <div className="text-center mb-2">
              <span className="inline-block text-sm font-medium text-primary mb-2">
                <i className="ri-mental-health-line mr-1"></i>
                What's your answer?
              </span>
            </div>
            
            <div className="flex shadow-lg rounded-full overflow-hidden border-2 border-primary/30 bg-white">
              <Input
                type="text"
                placeholder="Type your answer here..."
                className="flex-1 border-0 focus:ring-2 focus:ring-primary focus:ring-opacity-30 rounded-l-full px-6 py-4 text-base font-medium outline-none transition-all duration-300"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isCheckingAnswer || isPaused}
              />
              <Button
                className="fun-button px-8 py-4 rounded-r-full font-bold transition-all"
                type="submit"
                disabled={isCheckingAnswer || !userAnswer.trim() || isPaused}
              >
                {isCheckingAnswer ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"></path>
                    </svg>
                    Checking...
                  </div>
                ) : (
                  <>
                    <i className="ri-send-plane-fill mr-1"></i>
                    Submit
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                Tip: Answers can be a single word or short phrase
              </span>
            </div>
          </form>
          
          {/* Game Controls - Kid-friendly style */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {/* Hint buttons in kid-friendly card containers */}
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="relative group">
                  <button 
                    className={`bg-gradient-to-br ${hintsUsed >= 5 ? 'from-gray-300 to-gray-400 opacity-70' : 'from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600'} text-white flex items-center px-4 py-2 rounded-xl font-bold shadow-md transition transform duration-200 ${hintsUsed < 5 ? 'hover:scale-105' : ''}`}
                    onClick={onGetHint}
                    disabled={isPaused || hintsUsed >= 5}
                  >
                    <div className="bg-white/20 rounded-full p-1 mr-2">
                      <i className="ri-lightbulb-flash-fill text-lg"></i>
                    </div>
                    {hintsUsed >= 5 ? "Out of Hints!" : "Get Next Hint"}
                    <span className="ml-2 text-xs bg-white/30 px-2 py-0.5 rounded-full font-bold">-5 pts</span>
                  </button>
                  
                  {/* Floating tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {hintsUsed}/5 hints used
                  </div>
                </div>
                
                {/* AI hint button already has nice styling from the component */}
                <AIHintButton riddle={riddle.question} />
                
                {/* Show Answer Button */}
                <button
                  className={`bg-gradient-to-br ${showAnswer ? 'from-gray-300 to-gray-400 opacity-70' : 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'} text-white flex items-center px-4 py-2 rounded-xl font-bold shadow-md transition transform duration-200 ${!showAnswer ? 'hover:scale-105' : ''}`}
                  onClick={() => {
                    if (window.confirm("Want to see the answer? No points will be awarded.")) {
                      // Set local state to show answer
                      setShowAnswer(true);
                      
                      // Call the callback to mark as viewed in the database
                      if (onShowAnswer) {
                        onShowAnswer();
                      }
                    }
                  }}
                  disabled={isPaused || showAnswer}
                >
                  <div className="bg-white/20 rounded-full p-1 mr-2">
                    <i className="ri-eye-line text-lg"></i>
                  </div>
                  Show Answer
                  <span className="ml-2 text-xs bg-white/30 px-2 py-0.5 rounded-full font-bold">0 pts</span>
                </button>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex justify-center gap-4 mb-4">
              <button 
                className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white flex items-center px-5 py-2 rounded-full font-bold shadow-md transition transform duration-200 hover:scale-105"
                onClick={onPreviousRiddle}
                disabled={isPaused}
              >
                <i className="ri-arrow-left-line mr-1.5 text-lg"></i>
                Previous
              </button>
              <button 
                className="bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 text-white flex items-center px-5 py-2 rounded-full font-bold shadow-md transition transform duration-200 hover:scale-105"
                onClick={onNextRiddle}
                disabled={isPaused}
              >
                Next
                <i className="ri-arrow-right-line ml-1.5 text-lg"></i>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* If it's the "all solved" message, only show the navigation controls with fun styling */}
      {riddle.answer === "" && (
        <div className="flex justify-center mt-6 mb-4">
          <button 
            className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white flex items-center px-5 py-2 rounded-full font-bold shadow-md transition transform duration-200 hover:scale-105"
            onClick={onPreviousRiddle}
          >
            <i className="ri-arrow-left-line mr-1.5 text-lg"></i>
            Previous Puzzle
          </button>
        </div>
      )}
    </div>
  );
}

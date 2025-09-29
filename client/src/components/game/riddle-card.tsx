import { type RiddleWithCategory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { FavoriteButton } from "@/components/ui/favorite-button";

type RiddleCardProps = {
  riddle: RiddleWithCategory;
  onPlayNow: () => void;
};

export default function RiddleCard({ riddle, onPlayNow }: RiddleCardProps) {
  // Check user progress to see if this riddle has been solved
  const { data: userProgress = [] } = useQuery<any[]>({
    queryKey: [`/api/user/1/progress`],
    enabled: !!riddle,
  });
  
  const isSolved = Array.isArray(userProgress) && userProgress.some(
    (progress: any) => progress.riddleId === riddle.id && progress.solved
  );
  
  // Get CSS classes based on category
  const getCategoryStyles = (categoryClass: string) => {
    switch (categoryClass) {
      case 'primary':
        return 'bg-primary bg-opacity-10 text-primary';
      case 'secondary':
        return 'bg-secondary bg-opacity-10 text-secondary';
      case 'accent':
        return 'bg-accent bg-opacity-10 text-accent';
      case 'warning':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'dark':
        return 'bg-dark bg-opacity-10 text-dark';
      default:
        return 'bg-primary bg-opacity-10 text-primary';
    }
  };
  
  return (
    <div className="riddle-card flex flex-col bg-white rounded-xl shadow-md overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:-translate-y-2">
      {/* Card Header with fun decorative elements */}
      <div className="relative p-4">
        {/* Decorative bubbles in corner */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none">
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary"></div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-secondary"></div>
          <div className="absolute top-4 right-8 w-1.5 h-1.5 rounded-full bg-accent"></div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          {/* Category badge with fun styling */}
          <span className={`${getCategoryStyles(riddle.category.colorClass)} text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm`}>
            {riddle.category.name}
          </span>
          
          <div className="flex items-center gap-1">
            {/* Favorite button */}
            <FavoriteButton riddleId={riddle.id} size="sm" />
            
            {/* Solved badge or difficulty stars */}
            {isSolved ? (
              <span className="bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full flex items-center">
                <i className="ri-check-line mr-1"></i>
                Solved!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium">
                {riddle.difficulty === 'easy' && (
                  <span className="flex items-center">
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    Easy
                  </span>
                )}
                {riddle.difficulty === 'medium' && (
                  <span className="flex items-center">
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    Medium
                  </span>
                )}
                {riddle.difficulty === 'hard' && (
                  <span className="flex items-center">
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    <i className="ri-star-fill mr-0.5 text-amber-500"></i>
                    Hard
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        
        {/* Display image thumbnail for visual riddles with fun border */}
        {riddle.imageUrl && (
          <div className="mb-3 overflow-hidden rounded-lg relative border-2 border-primary/20 shadow-md">
            <img 
              src={riddle.imageUrl} 
              alt="Visual riddle" 
              className="w-full h-36 object-cover transition-transform hover:scale-105 duration-500"
            />
            <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-primary/60 to-transparent p-2">
              <span className="text-xs text-white font-bold flex items-center">
                <i className="ri-image-line mr-1"></i>
                Visual Puzzle
              </span>
            </div>
          </div>
        )}
        
        {/* Riddle question with better visibility */}
        <h3 className="font-bold text-lg font-poppins mb-2 line-clamp-2 text-gray-800 bg-white/70 p-2 rounded-lg shadow-sm">
          {riddle.question}
        </h3>
        
        {/* Hint text with better visibility */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 shadow-sm">
          <div className="flex items-start">
            <div className="mr-2 mt-0.5 text-yellow-600">
              <i className="ri-lightbulb-flash-fill"></i>
            </div>
            <p className="text-yellow-800 text-sm font-medium flex-1">
              {riddle.hint ? riddle.hint : 'Solve this brain teaser challenge!'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Card Footer with Play button */}
      <div className="mt-auto bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex justify-between items-center border-t border-gray-100">
        <span className="text-dark-light text-sm flex items-center">
          <i className="ri-time-line mr-1 text-secondary"></i>
          <span>Avg. {riddle.avgSolveTimeSeconds || 30}s</span>
        </span>
        
        <button 
          className="fun-button text-white text-xs font-bold py-1.5 px-4 rounded-full"
          onClick={onPlayNow}
        >
          {isSolved ? 'Play Again' : 'Play Now'}
          <i className="ri-arrow-right-line ml-1"></i>
        </button>
      </div>
    </div>
  );
}

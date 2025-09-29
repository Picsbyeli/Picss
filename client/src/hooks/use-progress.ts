import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { Riddle, UserProgress } from '@shared/schema';

// Define a type for the progress with riddle details
export type ProgressWithRiddle = UserProgress & {
  riddle: Riddle & {
    category: {
      name: string;
      colorClass: string;
    }
  };
};

export function useProgress() {
  const { user } = useAuth();
  
  // Fetch user progress
  const { 
    data: progress = [], 
    isLoading: isLoadingProgress,
    error: progressError
  } = useQuery<UserProgress[]>({
    queryKey: ['/api/user', user?.id, 'progress'],
    enabled: !!user,
  });
  
  // Fetch riddles with categories to join with progress
  const {
    data: riddlesWithCategories = [],
    isLoading: isLoadingRiddles
  } = useQuery<(Riddle & { category: { name: string; colorClass: string } })[]>({
    queryKey: ['/api/riddles/with-categories'],
    enabled: !!user && progress.length > 0,
  });
  
  // Join progress with riddle details - ensure progress is an array before mapping
  const progressWithRiddles: ProgressWithRiddle[] = Array.isArray(progress) 
    ? progress.map(progressItem => {
        const matchingRiddle = riddlesWithCategories.find(
          riddle => riddle.id === progressItem.riddleId
        );
        
        if (matchingRiddle) {
          return {
            ...progressItem,
            riddle: matchingRiddle
          };
        }
        
        // Fallback for when the riddle isn't found
        return {
          ...progressItem,
          riddle: {
            id: progressItem.riddleId,
            question: 'Unknown Riddle',
            answer: '',
            hint: null,
            explanation: null,
            imageUrl: null,
            categoryId: 0,
            difficulty: 'medium',
            avgSolveTimeSeconds: null,
            creatorName: null,
            isFanMade: null,
            category: {
              name: 'Unknown',
              colorClass: 'gray'
            }
          }
        };
      })
    : []; // Return empty array if progress is not an array
  
  // Filter for solved and attempted riddles
  const solvedRiddles = progressWithRiddles.filter(item => item.solved);
  
  // Attempted but not solved riddles are those with hints used or time recorded but not solved
  const attemptedRiddles = progressWithRiddles.filter(item => 
    !item.solved && ((item.hintsUsed && item.hintsUsed > 0) || item.timeToSolveSeconds)
  );
  
  return {
    allProgress: progressWithRiddles,
    solvedRiddles,
    attemptedRiddles,
    isLoading: isLoadingProgress || isLoadingRiddles,
    error: progressError
  };
}
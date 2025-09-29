import { useQuery } from "@tanstack/react-query";
import { type RiddleWithCategory, type Category, type UserProgress } from "@shared/schema";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useRiddles() {
  const { user } = useAuth();
  // Get all categories
  const {
    data: allCategories = [],
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Filter out "Fan Made" category
  const categories = useMemo(() => {
    return allCategories.filter(category => 
      category.name.toLowerCase() !== 'fan made'
    );
  }, [allCategories]);
  
  // Get all riddles with categories
  const {
    data: allRiddlesWithCategories = [],
    isLoading: isLoadingRiddles,
    error: riddlesError,
  } = useQuery<RiddleWithCategory[]>({
    queryKey: ['/api/riddles/with-categories'],
  });
  
  // Include all riddles
  const riddlesWithCategories = useMemo(() => {
    return allRiddlesWithCategories;
  }, [allRiddlesWithCategories]);
  
  // Get user progress to track solved riddles
  const {
    data: userProgress = [],
    isLoading: isLoadingProgress,
  } = useQuery<UserProgress[]>({
    queryKey: ['/api/user', user?.id, 'progress'],
    enabled: !!user, // Only fetch when user is logged in
  });
  
  // Create a set of solved riddle IDs for faster lookup
  const solvedRiddleIds = useMemo(() => {
    // Make sure userProgress is an array before filtering
    const progressArray = Array.isArray(userProgress) ? userProgress : [];
    return new Set(progressArray.filter(p => p.solved).map(p => p.riddleId));
  }, [userProgress]);
  
  // Get unsolved riddles (for finding new ones)
  const unsolvedRiddles = useMemo(() => {
    return riddlesWithCategories.filter(riddle => !solvedRiddleIds.has(riddle.id));
  }, [riddlesWithCategories, solvedRiddleIds]);
  
  // Get riddles by category
  const getRiddlesByCategory = (categoryId: number | null): RiddleWithCategory[] => {
    if (categoryId === null) {
      return riddlesWithCategories;
    }
    return riddlesWithCategories.filter(riddle => riddle.categoryId === categoryId);
  };
  
  // Get unsolved riddles by category
  const getUnsolvedRiddlesByCategory = (categoryId: number | null): RiddleWithCategory[] => {
    if (categoryId === null) {
      return unsolvedRiddles;
    }
    return unsolvedRiddles.filter(riddle => riddle.categoryId === categoryId);
  };
  
  // Pick a random unsolved riddle, optionally filtered by category
  const getRandomUnsolvedRiddle = (categoryId: number | null = null): RiddleWithCategory | null => {
    // Always try to get unsolved riddles first
    const filteredUnsolvedRiddles = getUnsolvedRiddlesByCategory(categoryId);
    
    // If we have unsolved riddles, always return one of those
    if (filteredUnsolvedRiddles.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredUnsolvedRiddles.length);
      return filteredUnsolvedRiddles[randomIndex];
    }
    
    // Only if ALL riddles in this category are solved, show a message instead of repeating
    if (unsolvedRiddles.length === 0) {
      // Check if there are any riddles at all
      const allRiddles = getRiddlesByCategory(categoryId);
      if (allRiddles.length === 0) return null;
      
      // Create a dummy riddle to show a "Completed" message
      const firstRiddle = allRiddles[0];
      // Return a notification riddle (this will be specially handled in the UI)
      return {
        ...firstRiddle,
        question: "Congratulations! You've solved all the available riddles in this category. Try another category or check back later for new riddles!",
        answer: "",
        hint: null,
        explanation: null,
        imageUrl: null,
        categoryId: firstRiddle.categoryId,
        category: firstRiddle.category,
        difficulty: "easy"
      };
    }
    
    // If no unsolved riddles in the specified category but there are unsolved riddles in other categories
    // suggest another category with unsolved riddles
    const randomUnsolvedRiddle = unsolvedRiddles[Math.floor(Math.random() * unsolvedRiddles.length)];
    return randomUnsolvedRiddle;
  };
  
  return {
    categories,
    riddles: riddlesWithCategories,
    riddlesWithCategories,
    unsolvedRiddles,
    solvedRiddleIds,
    getRandomUnsolvedRiddle,
    getRiddlesByCategory,
    getUnsolvedRiddlesByCategory,
    isLoadingCategories,
    isLoadingRiddles,
    isLoadingProgress,
    categoriesError,
    riddlesError,
  };
}

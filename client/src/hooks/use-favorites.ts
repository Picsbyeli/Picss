import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FavoriteWithRiddleAndCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useFavorites() {
  const { user } = useAuth();
  
  // Fetch user favorites
  const {
    data: favorites = [],
    isLoading: isLoadingFavorites,
    error: favoritesError,
  } = useQuery<FavoriteWithRiddleAndCategory[]>({
    queryKey: ['/api/user', user?.id, 'favorites'],
    enabled: !!user,
  });
  
  // Check if a riddle is favorited
  const checkIsFavorited = async (riddleId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use a cache key to deduplicate and prevent too many requests
      const cacheKey = `favorite-${user.id}-${riddleId}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      
      if (cachedResult !== null) {
        return cachedResult === 'true';
      }
      
      const response = await apiRequest('GET', `/api/user/${user.id}/favorites/check/${riddleId}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result for this session
      sessionStorage.setItem(cacheKey, String(data.isFavorited));
      
      return data.isFavorited;
    } catch (error) {
      // Silently fail without console error that triggers the modal
      return false;
    }
  };
  
  // Toggle favorite status for a riddle
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (riddleId: number) => {
      if (!user) throw new Error("User not authenticated");
      
      try {
        const response = await apiRequest("POST", `/api/user/${user.id}/favorites/toggle/${riddleId}`, {});
        return await response.json();
      } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both the favorites list and any check queries
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'favorites'] });
    },
    onError: (error) => {
      console.error("Error in favorite mutation:", error);
    }
  });
  
  // Create a strongly typed wrapper for toggleFavorite that accepts optional callbacks
  const toggleFavorite = (
    riddleId: number, 
    options?: { 
      onSuccess?: () => void, 
      onError?: (error: Error) => void 
    }
  ) => {
    toggleFavoriteMutation.mutate(riddleId, {
      onSuccess: (data) => {
        // Update cache to prevent unnecessary API calls
        if (user) {
          const cacheKey = `favorite-${user.id}-${riddleId}`;
          sessionStorage.setItem(cacheKey, String(data.added));
          
          // Also invalidate the favorites list query
          queryClient.invalidateQueries({ queryKey: ['/api/user', user.id, 'favorites'] });
        }
        
        if (options?.onSuccess) options.onSuccess();
      },
      onError: (error) => {
        if (options?.onError) options.onError(error);
      }
    });
  };

  return {
    favorites,
    isLoadingFavorites,
    favoritesError,
    checkIsFavorited,
    toggleFavorite,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  };
}
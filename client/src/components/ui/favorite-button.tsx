import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

type FavoriteButtonProps = {
  riddleId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  alwaysShow?: boolean; // If true, button will always show even for non-authenticated users
};

export function FavoriteButton({ 
  riddleId, 
  size = "md", 
  className,
  alwaysShow = false
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { checkIsFavorited, toggleFavorite, isTogglingFavorite } = useFavorites();
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const { toast } = useToast();

  // Get dimensions based on size
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  // Check favorite status on load
  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        if (user) {
          const status = await checkIsFavorited(riddleId);
          setIsFavorited(status);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [riddleId, user, checkIsFavorited]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent button/card clicks
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }
    
    if (isTogglingFavorite || isCheckingStatus) {
      return; // Prevent multiple clicks while operation is in progress
    }
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    
    // Optimistically update the UI
    const newState = !isFavorited;
    setIsFavorited(newState);
    
    // Perform the actual toggle
    toggleFavorite(riddleId, {
      onError: () => {
        // Revert back on error
        setIsFavorited(!newState);
        
        toast({
          title: newState ? "Failed to add favorite" : "Failed to remove favorite",
          description: "Please try again",
          variant: "destructive"
        });
      },
      onSuccess: () => {
        toast({
          title: newState ? "Added to favorites" : "Removed from favorites",
          variant: "default"
        });
      }
    });
  };

  // Don't show for non-authenticated users unless alwaysShow is true
  if (!user && !alwaysShow) {
    return null;
  }

  // If user is not authenticated but we should always show the button
  if (!user && alwaysShow) {
    return (
      <button
        className={cn(
          "flex items-center justify-center rounded-full p-1 transition-all duration-200",
          isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-500",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          toast({
            title: "Sign in required",
            description: "Please sign in to save favorites",
            variant: "destructive",
          });
        }}
        aria-label="Add to favorites (requires sign in)"
      >
        <Heart
          className={cn(
            sizeClasses[size],
            "transition-all duration-200 fill-none"
          )}
        />
      </button>
    );
  }

  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-full p-1 transition-all duration-200",
        isFavorited 
          ? "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500" 
          : isDarkMode 
            ? "text-gray-400 hover:text-red-400" 
            : "text-gray-400 hover:text-red-500",
        isCheckingStatus || isTogglingFavorite ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={handleToggleFavorite}
      disabled={isCheckingStatus || isTogglingFavorite}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          "transition-all duration-300",
          isAnimating && isFavorited && "animate-heartbeat",
          isFavorited ? "fill-current" : "fill-none"
        )}
      />
    </button>
  );
}
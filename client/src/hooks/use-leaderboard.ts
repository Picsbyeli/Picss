import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

// Extended user type with score and stats
type LeaderboardUser = User & {
  solvedCount: number;
  avgTimeSeconds: number;
  burbleCount: number;
  valentineCount: number;
  emojiCount: number;
  brainTeaserCount: number;
  triviaCount: number;
  animalTriviaCount: number;
};

export function useLeaderboard() {
  // Fetch leaderboard data
  const {
    data: leaderboard = [],
    isLoading,
    error,
  } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });
  
  return {
    leaderboard,
    isLoading,
    error
  };
}
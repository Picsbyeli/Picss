import { useQuery } from "@tanstack/react-query";
export function useLeaderboard() {
    // Fetch leaderboard data
    const { data: leaderboard = [], isLoading, error, } = useQuery({
        queryKey: ['/api/leaderboard'],
    });
    return {
        leaderboard,
        isLoading,
        error
    };
}

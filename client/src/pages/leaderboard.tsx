import { useState } from "react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";
import CustomAvatarDisplay from "@/components/avatar/custom-avatar-display";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function to format time in minutes and seconds
function formatTime(seconds: number): string {
  if (!seconds) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const { leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();

  // Get the user's rank in the leaderboard
  const getUserRank = () => {
    if (!user) return null;
    const index = leaderboard.findIndex(u => u.id === user.id);
    return index >= 0 ? index + 1 : null;
  };

  const userRank = getUserRank();

  // Creates trophy emoji/icons for top ranks
  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Trophy className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Trophy className="h-5 w-5 text-amber-700" />;
    }
    return <span>{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl px-4 md:px-6 py-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          See how you stack up against other players!
        </p>
      </div>

      {/* User's rank highlight */}
      {user && userRank && (
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle>Your Ranking</CardTitle>
            <CardDescription>
              Here's where you stand on the leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <CustomAvatarDisplay
                    config={user.avatarConfig ? JSON.parse(user.avatarConfig) : null}
                    username={user.username}
                    profileImageUrl={user.profileImageUrl}
                    size={48}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {userRank}
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.solvedCount} puzzles solved
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Burble: {user.burbleCount || 0}</span>
                    <span>Valentine: {user.valentineCount || 0}</span>
                    <span>Emoji: {user.emojiCount || 0}</span>
                    <span>Trivia: {user.triviaCount || 0}</span>
                    <span>Animals: {user.animalTriviaCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{user.score}</p>
                <p className="text-sm text-muted-foreground">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
          <CardDescription>Based on total score</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Burble</TableHead>
                <TableHead className="text-center">Valentine</TableHead>
                <TableHead className="text-center">Emoji</TableHead>
                <TableHead className="text-center">Trivia</TableHead>
                <TableHead className="text-center">Animals</TableHead>
                <TableHead className="text-center">Total Solved</TableHead>
                <TableHead className="text-center">Avg. Time</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <TableRow 
                    key={player.id}
                    className={player.id === user?.id ? "bg-primary/5 font-medium" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center">
                        <RankBadge rank={index + 1} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CustomAvatarDisplay
                          config={player.avatarConfig ? JSON.parse(player.avatarConfig) : null}
                          username={player.username}
                          profileImageUrl={player.profileImageUrl}
                          size={32}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{player.username}</span>
                          {player.id === user?.id && (
                            <Badge variant="outline" className="w-fit text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{player.burbleCount || 0}</TableCell>
                    <TableCell className="text-center">{player.valentineCount || 0}</TableCell>
                    <TableCell className="text-center">{player.emojiCount || 0}</TableCell>
                    <TableCell className="text-center">{player.triviaCount || 0}</TableCell>
                    <TableCell className="text-center">{player.animalTriviaCount || 0}</TableCell>
                    <TableCell className="text-center">{player.solvedCount}</TableCell>
                    <TableCell className="text-center">{formatTime(player.avgTimeSeconds)}</TableCell>
                    <TableCell className="text-right font-bold">{player.score}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    Start solving puzzles to appear on the leaderboard!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
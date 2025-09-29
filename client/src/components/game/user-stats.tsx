import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type UserStatsProps = {
  stats: {
    score: number;
    solvedCount: number;
    avgTimeSeconds: number;
  };
  onStartNewGame: () => void;
  isLoading: boolean;
};

export default function UserStats({ stats, onStartNewGame, isLoading }: UserStatsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="ml-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          <div className="flex items-center">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary">
            <i className="ri-trophy-line text-xl"></i>
          </div>
          <div className="ml-3">
            <p className="text-gray-600 text-sm">Your Score</p>
            <p className="font-bold text-xl text-purple-700">{Math.max(stats.score, 0)} pts</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center text-secondary">
            <i className="ri-check-line text-xl"></i>
          </div>
          <div className="ml-3">
            <p className="text-gray-600 text-sm">Solved</p>
            <p className="font-bold text-xl text-green-700">{stats.solvedCount} riddles</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-full flex items-center justify-center text-accent">
            <i className="ri-time-line text-xl"></i>
          </div>
          <div className="ml-3">
            <p className="text-gray-600 text-sm">Average Time</p>
            <p className="font-bold text-xl text-pink-700">{stats.avgTimeSeconds} seconds</p>
          </div>
        </div>
        
        {/* Start New Game button removed */}
      </div>
    </div>
  );
}

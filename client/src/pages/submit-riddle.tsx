import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import SubmitRiddleForm from "@/components/forms/submit-riddle-form";
import VisualRiddleExamples from "@/components/game/visual-riddle-examples";
import { ArrowLeft } from "lucide-react";

export default function SubmitRiddle() {
  const [_, setLocation] = useLocation();
  
  // Fetch user stats to display in the page
  const { data: userStats = { score: 0, solvedCount: 0, avgTimeSeconds: 0 } } = useQuery({
    queryKey: ['/api/user/1/stats'],
  });
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-16">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gradient">Create Your Own Riddle</h1>
        <p className="text-dark-light">
          Share your brain teasers with the Burble community!
        </p>
      </div>
      
      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
        <div className="flex flex-wrap justify-between">
          <div className="text-center p-2 flex-1">
            <p className="text-dark-light text-sm mb-1">Total Score</p>
            <p className="text-2xl font-bold">{userStats?.score || 0}</p>
          </div>
          <div className="text-center p-2 flex-1">
            <p className="text-dark-light text-sm mb-1">Riddles Solved</p>
            <p className="text-2xl font-bold">{userStats?.solvedCount || 0}</p>
          </div>
          <div className="text-center p-2 flex-1">
            <p className="text-dark-light text-sm mb-1">Avg. Time</p>
            <p className="text-2xl font-bold">{userStats?.avgTimeSeconds || 0}s</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-center text-dark-light text-sm">
            Earn <span className="font-semibold text-success">10 points</span> for each riddle you submit!
          </p>
        </div>
      </div>
      
      {/* Visual Riddle Examples Section */}
      <VisualRiddleExamples />
      
      {/* Submission Form */}
      <SubmitRiddleForm />
      
      {/* Tips Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Tips for Creating Great Riddles</h2>
        <ul className="space-y-3 list-disc list-inside ml-4">
          <li>Make sure your riddle has a unique and clear solution</li>
          <li>Add a detailed explanation to help others understand the answer</li>
          <li>For visual riddles, provide an image URL that shows the riddle clearly</li>
          <li>Double-check your spelling and grammar before submission</li>
          <li>Be creative but fair - the best riddles are challenging but solvable</li>
        </ul>
      </div>
    </div>
  );
}
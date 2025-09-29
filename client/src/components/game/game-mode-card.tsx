import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type GameModeCardProps = {
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  linkTo: string;
  difficulty?: string;
};

export default function GameModeCard({
  title,
  description,
  icon,
  backgroundColor,
  linkTo,
  difficulty
}: GameModeCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={`h-2 ${backgroundColor}`}></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <i className={`${icon} text-2xl`}></i>
            {title}
          </CardTitle>
          {difficulty && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {difficulty}
            </span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600">
          {title === "Burble" && "Guess the word with color-coded feedback"}
          {title === "EV Special" && "Ask yes/no questions to identify the subject"}
          {title === "Emoji Guess" && "Decode emoji combinations for different themes"}
          {title === "Brain Teasers" && "Solve challenging riddles and puzzles"}
        </p>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={linkTo} className="w-full">
          <Button className={`w-full ${backgroundColor}`}>
            Play Now <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
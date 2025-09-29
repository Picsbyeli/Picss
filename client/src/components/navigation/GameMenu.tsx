import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Gamepad2 } from 'lucide-react';

interface Game {
  name: string;
  path: string;
  icon: string;
  description: string;
}

const games: Game[] = [
  {
    name: "Burble Word Game",
    path: "/burble",
    icon: "🎯",
    description: "Guess the hidden word"
  },
  {
    name: "Riddles",
    path: "/",
    icon: "🧩",
    description: "Brain teasers and puzzles"
  },
  {
    name: "Emoji Guess",
    path: "/emoji-guess",
    icon: "😊",
    description: "Decode emoji combinations"
  },
  {
    name: "Trivia",
    path: "/trivia",
    icon: "🧠",
    description: "General knowledge questions"
  },
  {
    name: "Animal Trivia",
    path: "/animal-trivia",
    icon: "🐾",
    description: "Test your animal knowledge"
  },
  {
    name: "School Trivia",
    path: "/school-trivia",
    icon: "📚",
    description: "Educational trivia questions"
  },
  {
    name: "Twenty Questions",
    path: "/ev-special",
    icon: "❓",
    description: "Are You My Valentine?"
  },
  {
    name: "Geo Guesser",
    path: "/geo-guesser",
    icon: "🌍",
    description: "Guess locations around the world"
  },
  {
    name: "Battle Arena",
    path: "/multiplayer",
    icon: "⚔️",
    description: "Multiplayer competition"
  },
  {
    name: "Audio Manager",
    path: "/audio-manager",
    icon: "🎵",
    description: "Manage your music collection"
  }
];

export function GameMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
          data-testid="button-games-menu"
        >
          <Menu className="h-4 w-4" />
          <Gamepad2 className="h-4 w-4" />
          All Games
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
        <div className="p-2">
          <h3 className="font-semibold text-sm text-gray-700 mb-2 px-2">Choose Your Game</h3>
          {games.map((game) => (
            <Link key={game.path} href={game.path}>
              <DropdownMenuItem 
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-purple-50 rounded-md"
                data-testid={`menu-item-${game.path.replace('/', '') || 'home'}`}
              >
                <span className="text-lg flex-shrink-0">{game.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">{game.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{game.description}</div>
                </div>
              </DropdownMenuItem>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
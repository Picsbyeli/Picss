import { useState, useEffect } from "react";
import UserStats from "@/components/game/user-stats";
import { useRiddles } from "@/hooks/use-riddles";
import { useGame } from "@/hooks/use-game";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, BookOpen, Lightbulb, Puzzle, Target, Star, ChevronRight, Swords, Zap, Volume2, GraduationCap, Globe, Trophy, Gamepad2 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { 
    categories,
    getRiddlesByCategory,
    isLoadingCategories 
  } = useRiddles();
  
  const { userStats } = useGame();

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('math') || name.includes('number')) return Calculator;
    if (name.includes('logic')) return Brain;
    if (name.includes('word') || name.includes('riddle')) return BookOpen;
    if (name.includes('puzzle')) return Puzzle;
    return Lightbulb;
  };

  // Get category color with better visibility
  const getCategoryColor = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('math') || name.includes('number')) return 'bg-blue-100 text-blue-800 border-2 border-blue-500 hover:bg-blue-200';
    if (name.includes('logic')) return 'bg-purple-100 text-purple-800 border-2 border-purple-500 hover:bg-purple-200';
    if (name.includes('word') || name.includes('riddle')) return 'bg-green-100 text-green-800 border-2 border-green-500 hover:bg-green-200';
    if (name.includes('puzzle')) return 'bg-orange-100 text-orange-800 border-2 border-orange-500 hover:bg-orange-200';
    return 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 border-2 border-purple-500 hover:from-pink-200 hover:to-purple-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="text-center">
            <div className="mb-6">
              <span className="text-6xl md:text-8xl">🧠</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              Brain Teasers & Riddles
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl font-semibold text-white/90 max-w-4xl mx-auto">
              🎮 Challenge your mind with puzzles, trivia games, and brain games! 🚀
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-bounce">⭐</div>
        <div className="absolute top-20 right-10 text-3xl opacity-20 animate-bounce delay-500">💫</div>
        <div className="absolute bottom-10 left-1/4 text-2xl opacity-20 animate-bounce delay-1000">✨</div>
      </div>

      {/* Game Modes Section - Prominently at the top */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl border-t-4 border-gradient-to-r from-pink-400 to-purple-400">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-pink-500 to-violet-500 p-3 rounded-full">
                <Gamepad2 className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Game Modes
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              🎯 Choose from our amazing collection of brain teasers, trivia games, and puzzle challenges! 
            </p>
          </div>

          {/* Trivia Games Section */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-2xl md:text-3xl">🧠</span>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Trivia Games
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
              <Link href="/trivia">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Trophy className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">General Trivia</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🎯 Multiple choice questions across all topics
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/animal-trivia">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 hover:border-green-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-2xl md:text-3xl">🐾</span>
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Animal Trivia</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🦁 Test your knowledge about the animal kingdom
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/school-trivia">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200 hover:border-purple-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <GraduationCap className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">School Trivia</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      📚 Math, Science, English & History by grade level
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Word & Puzzle Games */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-2xl md:text-3xl">🎯</span>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Word & Puzzle Games
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              <Link href="/burble">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-cyan-50 to-blue-100 border-2 border-cyan-200 hover:border-cyan-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-2 text-gray-800">Burble Word Game</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      💡 Word guessing with color-coded feedback
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-violet-50 to-purple-100 border-2 border-violet-200 hover:border-violet-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Lightbulb className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-2 text-gray-800">Brain Riddles</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      🧩 Classic riddles and brain teasers
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/ev-special">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-lime-50 to-green-100 border-2 border-lime-200 hover:border-lime-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 text-white p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Target className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-2 text-gray-800">Twenty Questions</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      🤔 Yes/No question guessing game
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/emoji-guess">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-200 hover:border-yellow-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Puzzle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-2 text-gray-800">Emoji Guess</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      😄 Decode emoji combinations for themes
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Adventure & Battle Games */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-2xl md:text-3xl">⚔️</span>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                Adventure & Battle Games
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
              <Link href="/multiplayer">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-red-50 to-pink-100 border-2 border-red-200 hover:border-red-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Swords className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Battle Arena</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      ⚔️ Multiplayer battles with sprite characters
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/geo-guesser">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 hover:border-teal-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Globe className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Geo Guesser</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🌍 Guess locations around the world
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/audio-manager">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Volume2 className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Music & Audio</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🎵 Stream music from Spotify, YouTube & more
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Geography & Special Games */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-2xl md:text-3xl">🌍</span>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Geography & Special Games
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
              <Link href="/geo-guesser">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 hover:border-teal-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Globe className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Geo Guesser</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🗺️ Guess world locations, US states & continents
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/audio-manager">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 bg-gradient-to-br from-pink-50 to-rose-100 border-2 border-pink-200 hover:border-pink-400 rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 md:p-8 text-center">
                    <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white p-4 md:p-5 rounded-2xl w-fit mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Volume2 className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold mb-3 text-gray-800">Audio Manager</CardTitle>
                    <CardDescription className="text-gray-600 text-base md:text-lg">
                      🎵 Upload and manage your audio files
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Riddle Categories */}
          {!isLoadingCategories && categories.length > 0 && (
            <div>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="text-2xl md:text-3xl">🧩</span>
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Brain Teaser Categories
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {categories.map(category => {
                  const Icon = getCategoryIcon(category.name);
                  const categoryRiddles = getRiddlesByCategory(category.id);
                  
                  return (
                    <Link key={category.id} href={`/category/${category.id}`}>
                      <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-purple-300 rounded-2xl overflow-hidden group">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                              <Icon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                            <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                              {categoryRiddles.length} riddles
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-lg md:text-xl font-bold mb-2 text-gray-800">{category.name}</CardTitle>
                          <CardDescription className="text-sm md:text-base text-gray-600 mb-3">
                            {category.description}
                          </CardDescription>
                          <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700 transition-colors">
                            Start Playing <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Stats and Features */}
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* User Stats */}
          <div className="max-w-4xl mx-auto mb-16 md:mb-20">
            <div className="text-center mb-8 md:mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl md:text-4xl">📊</span>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Your Progress
                </h2>
              </div>
              <p className="text-lg md:text-xl text-gray-700 font-medium">
                🏆 Track your achievements and level up your brain power!
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-purple-200 p-6 md:p-8">
              <UserStats 
                stats={{
                  score: 0,
                  solvedCount: 0,
                  avgTimeSeconds: 0,
                  ...(typeof userStats === 'object' && userStats !== null ? userStats as any : {})
                }} 
                onStartNewGame={() => window.location.href = `/category/${categories[0]?.id || 25}`} 
                isLoading={false}
              />
            </div>
          </div>

          {/* Multiplayer Battle Feature */}
          <div className="mb-12">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 text-white border-0 shadow-2xl rounded-3xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-500/20 to-yellow-500/20"></div>
                <CardContent className="p-8 md:p-12 relative">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <div className="bg-white/20 p-3 rounded-full">
                          <Swords className="h-8 w-8" />
                        </div>
                        <span className="text-sm md:text-base font-bold bg-white/20 px-4 py-2 rounded-full animate-pulse">
                          ✨ NEW FEATURE! ✨
                        </span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-extrabold mb-4">Battle Arena</h3>
                      <p className="text-white/95 text-lg md:text-xl mb-8 leading-relaxed">
                        🔥 Challenge players worldwide in real-time brain battles and climb the leaderboards! 
                        Show everyone who's the ultimate brain teaser champion! 🎯
                      </p>
                      <Link href="/multiplayer">
                        <Button 
                          variant="secondary" 
                          size="lg" 
                          className="bg-white text-red-600 hover:bg-yellow-100 hover:text-red-700 px-8 py-4 text-lg font-bold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          <Zap className="h-6 w-6 mr-3" />
                          Start Epic Battle! 🚀
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-9xl opacity-30 animate-bounce">⚔️</div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 text-2xl opacity-20 animate-bounce">💥</div>
                  <div className="absolute bottom-4 left-4 text-xl opacity-20 animate-bounce delay-500">⚡</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
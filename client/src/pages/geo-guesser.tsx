import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, MapPin, Target, Trophy, HelpCircle, AlertTriangle, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InteractiveMap } from "@/components/ui/interactive-map";
import { apiRequest } from "@/lib/queryClient";

// Import landmark images
import eiffelTowerImg from "@assets/stock_images/eiffel_tower_paris_f_535bd0d0.jpg";
import greatWallImg from "@assets/stock_images/great_wall_of_china__3c8e986c.jpg";
import statueOfLibertyImg from "@assets/stock_images/statue_of_liberty_ne_a954c425.jpg";
import machuPicchuImg from "@assets/stock_images/machu_picchu_peru_an_ea35fad3.jpg";
import sydneyOperaImg from "@assets/stock_images/sydney_opera_house_a_bd1d5a4b.jpg";
import pyramidsImg from "@assets/stock_images/pyramids_of_giza_egy_b0c3ab9f.jpg";
import bigBenImg from "@assets/stock_images/big_ben_london_clock_13f4e336.jpg";
import mountFujiImg from "@assets/stock_images/mount_fuji_japan_vol_26dc90c4.jpg";
import christRedeemerImg from "@assets/stock_images/christ_the_redeemer__94dd65f7.jpg";
import tajMahalImg from "@assets/stock_images/taj_mahal_india_whit_a3f75d87.jpg";

interface WorldLocation {
  name: string;
  country: string;
  city: string;
  continent: string;
  hint: string;
}

interface USState {
  name: string;
  capital: string;
  nickname: string;
  region: string;
}

interface Continent {
  name: string;
  countries: string[];
  landmarks: string[];
}

const geoData = {
  world: [
    { name: "Eiffel Tower", country: "France", city: "Paris", continent: "Europe", hint: "Iron lattice tower, symbol of romance" },
    { name: "Great Wall of China", country: "China", city: "Beijing", continent: "Asia", hint: "Ancient fortification, visible from space" },
    { name: "Statue of Liberty", country: "USA", city: "New York", continent: "North America", hint: "Gift from France, symbol of freedom" },
    { name: "Machu Picchu", country: "Peru", city: "Cusco", continent: "South America", hint: "Ancient Incan citadel in the mountains" },
    { name: "Sydney Opera House", country: "Australia", city: "Sydney", continent: "Australia", hint: "Distinctive shell-like design" },
    { name: "Pyramids of Giza", country: "Egypt", city: "Cairo", continent: "Africa", hint: "Ancient tombs of pharaohs" },
    { name: "Big Ben", country: "UK", city: "London", continent: "Europe", hint: "Famous clock tower" },
    { name: "Mount Fuji", country: "Japan", city: "Tokyo", continent: "Asia", hint: "Sacred mountain and volcano" },
    { name: "Christ the Redeemer", country: "Brazil", city: "Rio de Janeiro", continent: "South America", hint: "Massive statue overlooking the city" },
    { name: "Taj Mahal", country: "India", city: "Agra", continent: "Asia", hint: "White marble mausoleum" }
  ],
  usStates: [
    { name: "California", capital: "Sacramento", nickname: "Golden State", region: "West Coast" },
    { name: "Texas", capital: "Austin", nickname: "Lone Star State", region: "South" },
    { name: "Florida", capital: "Tallahassee", nickname: "Sunshine State", region: "Southeast" },
    { name: "New York", capital: "Albany", nickname: "Empire State", region: "Northeast" },
    { name: "Alaska", capital: "Juneau", nickname: "Last Frontier", region: "Pacific" },
    { name: "Hawaii", capital: "Honolulu", nickname: "Aloha State", region: "Pacific" },
    { name: "Colorado", capital: "Denver", nickname: "Centennial State", region: "Mountain West" },
    { name: "Maine", capital: "Augusta", nickname: "Pine Tree State", region: "New England" },
    { name: "Nevada", capital: "Carson City", nickname: "Silver State", region: "Mountain West" },
    { name: "Vermont", capital: "Montpelier", nickname: "Green Mountain State", region: "New England" }
  ],
  continents: [
    { name: "Africa", countries: ["Nigeria", "Egypt", "South Africa", "Kenya", "Morocco"], landmarks: ["Sahara Desert", "Victoria Falls", "Kilimanjaro"] },
    { name: "Asia", countries: ["China", "India", "Japan", "Thailand", "South Korea"], landmarks: ["Himalayas", "Great Wall", "Mount Fuji"] },
    { name: "Europe", countries: ["France", "Germany", "Italy", "Spain", "UK"], landmarks: ["Alps", "Mediterranean Sea", "Eiffel Tower"] },
    { name: "North America", countries: ["USA", "Canada", "Mexico"], landmarks: ["Grand Canyon", "Niagara Falls", "Rocky Mountains"] },
    { name: "South America", countries: ["Brazil", "Argentina", "Peru", "Chile", "Colombia"], landmarks: ["Amazon Rainforest", "Andes Mountains", "Machu Picchu"] },
    { name: "Australia/Oceania", countries: ["Australia", "New Zealand", "Fiji"], landmarks: ["Great Barrier Reef", "Uluru", "Sydney Opera House"] }
  ]
};

// Landmark image mapping
const landmarkImages: { [key: string]: string } = {
  "Eiffel Tower": eiffelTowerImg,
  "Great Wall of China": greatWallImg,
  "Statue of Liberty": statueOfLibertyImg,
  "Machu Picchu": machuPicchuImg,
  "Sydney Opera House": sydneyOperaImg,
  "Pyramids of Giza": pyramidsImg,
  "Big Ben": bigBenImg,
  "Mount Fuji": mountFujiImg,
  "Christ the Redeemer": christRedeemerImg,
  "Taj Mahal": tajMahalImg
};

type GameMode = 'world' | 'usStates' | 'continents' | 'interactive';

export default function GeoGuesser() {
  const [gameMode, setGameMode] = useState<GameMode>('world');
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [totalRounds] = useState(5);
  const [showResult, setShowResult] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [showDetailedHint, setShowDetailedHint] = useState(false);
  const { toast } = useToast();

  // API queries for interactive map (used for both usStates and interactive modes)
  const { data: usStatesMap, isLoading: isLoadingMap } = useQuery({
    queryKey: ['/api/geography/maps/us-states'],
    enabled: gameMode === 'interactive' || gameMode === 'usStates',
  });

  const submitMapResultMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/geography/submit', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Results Submitted! 🎉",
        description: "Your geography score has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInteractiveMapComplete = async (results: any) => {
    try {
      if (usStatesMap) {
        const resultData = {
          mapId: usStatesMap.id,
          answers: results.answers || {},
          timeSpent: results.timeSpent || 0,
          hintsUsed: results.hintsUsed || 0,
        };
        
        await submitMapResultMutation.mutateAsync(resultData);
      }
    } catch (error) {
      console.error('Error submitting interactive map results:', error);
    }
  };

  const getModeDisplayName = (mode: GameMode) => {
    switch (mode) {
      case 'world': return 'World Locations';
      case 'usStates': return 'US States';
      case 'continents': return 'Continents';
      case 'interactive': return 'Interactive US Map';
    }
  };

  const getModeIcon = (mode: GameMode) => {
    switch (mode) {
      case 'world': return Globe;
      case 'usStates': return MapPin;
      case 'continents': return Target;
      case 'interactive': return Map;
    }
  };

  const startGame = () => {
    setCurrentRound(0);
    setScore(0);
    setGameActive(true);
    setGameOver(false);
    setRoundScores([]);
    showNextLocation();
  };

  const showNextLocation = () => {
    const data = geoData[gameMode];
    const randomLocation = data[Math.floor(Math.random() * data.length)];
    setCurrentLocation(randomLocation);
    setGuess("");
    setShowResult(false);
    setHintUsed(false);
    setShowDetailedHint(false);
  };

  const submitGuess = () => {
    if (!guess.trim()) return;

    let isCorrect = false;
    let points = 0;

    if (gameMode === 'world') {
      const location = currentLocation as WorldLocation;
      isCorrect = 
        guess.toLowerCase().includes(location.country.toLowerCase()) ||
        guess.toLowerCase().includes(location.city.toLowerCase()) ||
        guess.toLowerCase().includes(location.name.toLowerCase());
    } else if (gameMode === 'usStates') {
      const state = currentLocation as USState;
      isCorrect = 
        guess.toLowerCase().includes(state.name.toLowerCase()) ||
        guess.toLowerCase().includes(state.capital.toLowerCase());
    } else if (gameMode === 'continents') {
      const continent = currentLocation as Continent;
      isCorrect = guess.toLowerCase().includes(continent.name.toLowerCase());
    }

    if (isCorrect) {
      points = gameMode === 'world' ? 100 : gameMode === 'usStates' ? 75 : 50;
      
      // Apply drastic penalty if hint was used (75% reduction)
      if (hintUsed) {
        points = Math.floor(points * 0.25); // Only 25% of original points
      }
      
      setScore(score + points);
      toast({
        title: "Correct!",
        description: hintUsed 
          ? `Correct! +${points} points (penalty applied for using hint)`
          : `Great job! +${points} points`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: `The answer was: ${getCorrectAnswer()}`,
        variant: "destructive",
      });
    }

    setRoundScores([...roundScores, points]);
    setShowResult(true);
  };

  const getCorrectAnswer = () => {
    if (gameMode === 'world') {
      const location = currentLocation as WorldLocation;
      return `${location.name}, ${location.country}`;
    } else if (gameMode === 'usStates') {
      const state = currentLocation as USState;
      return `${state.name} (Capital: ${state.capital})`;
    } else {
      return currentLocation.name;
    }
  };

  const nextRound = () => {
    if (currentRound + 1 >= totalRounds) {
      setGameOver(true);
      setGameActive(false);
    } else {
      setCurrentRound(currentRound + 1);
      showNextLocation();
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setCurrentRound(0);
    setScore(0);
    setGuess("");
    setShowResult(false);
    setRoundScores([]);
  };

  const getHint = () => {
    if (gameMode === 'world') {
      return (currentLocation as WorldLocation).hint;
    } else if (gameMode === 'usStates') {
      const state = currentLocation as USState;
      return `Nickname: ${state.nickname} | Region: ${state.region}`;
    } else {
      const continent = currentLocation as Continent;
      return `Countries: ${continent.countries.slice(0, 3).join(', ')}...`;
    }
  };

  const getDetailedHint = () => {
    if (gameMode === 'world') {
      const location = currentLocation as WorldLocation;
      return `🌍 Continent: ${location.continent} | 🏙️ City: ${location.city}`;
    } else if (gameMode === 'usStates') {
      const state = currentLocation as USState;
      return `🏛️ Capital: ${state.capital} | 📍 First Letter: ${state.name.charAt(0)}`;
    } else {
      const continent = currentLocation as Continent;
      return `🗺️ Famous landmarks: ${continent.landmarks.slice(0, 2).join(', ')}`;
    }
  };

  const useHint = () => {
    setHintUsed(true);
    setShowDetailedHint(true);
    toast({
      title: "💡 Hint Used!",
      description: "Warning: Your points will be drastically reduced (75% penalty)",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Globe className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Geo Guesser</h1>
            <p className="text-xl md:text-2xl opacity-90">
              Test your geography knowledge around the world
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {!gameActive && !gameOver && (
          <>
            {/* Mode Selection */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Choose Game Mode</CardTitle>
                <CardDescription>Select the type of geography challenge you want</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['world', 'usStates', 'continents', 'interactive'] as GameMode[]).map(mode => {
                    const Icon = getModeIcon(mode);
                    return (
                      <Button
                        key={mode}
                        variant={gameMode === mode ? "default" : "outline"}
                        className="h-24 flex flex-col gap-2"
                        onClick={() => setGameMode(mode)}
                      >
                        <Icon className="h-8 w-8" />
                        {getModeDisplayName(mode)}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Start Game */}
            <div className="text-center">
              <Button size="lg" onClick={startGame}>
                Start {getModeDisplayName(gameMode)} Game
              </Button>
            </div>
          </>
        )}

        {/* Visual Map Modes (US States and Interactive) */}
        {(gameMode === 'interactive' || gameMode === 'usStates') && !gameOver && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-6 w-6" />
                  {gameMode === 'usStates' ? 'US States Visual Map' : 'Interactive US States Map'}
                </CardTitle>
                <CardDescription>
                  Click through US states and identify them on the interactive map. Complete geographic challenge with scoring, streaks, and time bonuses!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMap ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Loading interactive map...</p>
                  </div>
                ) : usStatesMap ? (
                  <InteractiveMap
                    map={usStatesMap}
                    onGameComplete={handleInteractiveMapComplete}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Interactive map not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {gameActive && !gameOver && gameMode !== 'interactive' && gameMode !== 'usStates' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Round {currentRound + 1} of {totalRounds}
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Score: {score}</p>
                  <p className="text-sm text-gray-500">{getModeDisplayName(gameMode)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Location Hint:</h3>
                  <p className="text-xl mb-4">{getHint()}</p>
                  
                  {/* Visual clue - displays landmark images for world mode */}
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      {gameMode === 'world' && currentLocation && landmarkImages[currentLocation.name] && (
                        <div>
                          <img 
                            src={landmarkImages[currentLocation.name]} 
                            alt="Famous landmark" 
                            className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-3"
                            style={{ maxHeight: '300px', objectFit: 'cover' }}
                          />
                          <p className="text-sm text-gray-600">📍 Where is this famous landmark located?</p>
                        </div>
                      )}
                      {gameMode === 'world' && currentLocation && !landmarkImages[currentLocation.name] && (
                        <div className="text-gray-500">
                          <Globe className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-sm">Famous landmark location</p>
                          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                            🗺️ Street view not available - use the hint to guess!
                          </div>
                        </div>
                      )}
                      {gameMode === 'usStates' && (
                        <div className="text-gray-500">
                          <MapPin className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-sm">US State Challenge</p>
                          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                            🇺🇸 Use the hint to identify the state!
                          </div>
                        </div>
                      )}
                      {gameMode === 'continents' && (
                        <div className="text-gray-500">
                          <Target className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-sm">Continental Challenge</p>
                          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                            🌍 Use the countries hint to identify the continent!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hint Section */}
                {!showResult && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Need extra help?</h4>
                      {!hintUsed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={useHint}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          data-testid="button-hint"
                        >
                          <HelpCircle className="w-4 h-4 mr-1" />
                          Get Hint (-75% points)
                        </Button>
                      )}
                      {hintUsed && (
                        <div className="flex items-center text-orange-600 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Hint Used
                        </div>
                      )}
                    </div>
                    
                    {showDetailedHint && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-800 font-medium">💡 Extra Hint:</p>
                        <p className="text-orange-700 mt-1">{getDetailedHint()}</p>
                      </div>
                    )}
                  </div>
                )}

                {!showResult && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guess">Your Guess</Label>
                      <Input
                        id="guess"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder={`Enter ${gameMode === 'world' ? 'country, city or landmark' : gameMode === 'usStates' ? 'state name or capital' : 'continent name'}`}
                        onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                        data-testid="input-guess"
                      />
                    </div>
                    <Button onClick={submitGuess} disabled={!guess.trim()} data-testid="button-submit">
                      Submit Guess
                    </Button>
                  </div>
                )}

                {showResult && (
                  <div className="text-center space-y-4">
                    <div className="text-lg">
                      <strong>Correct Answer:</strong> {getCorrectAnswer()}
                    </div>
                    <Button onClick={nextRound}>
                      {currentRound + 1 >= totalRounds ? 'Finish Game' : 'Next Location'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {gameOver && (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-3xl font-bold mb-4">Game Complete!</h2>
              
              <div className="space-y-2 mb-6">
                <p className="text-lg"><strong>Mode:</strong> {getModeDisplayName(gameMode)}</p>
                <p className="text-lg"><strong>Total Score:</strong> {score} points</p>
                <p className="text-lg"><strong>Average:</strong> {Math.round(score / totalRounds)} points per round</p>
                <p className="text-lg"><strong>Correct Guesses:</strong> {roundScores.filter(s => s > 0).length}/{totalRounds}</p>
              </div>

              <div className="mb-6">
                {score >= totalRounds * 80 ? (
                  <div className="text-green-600">
                    <h3 className="text-xl font-bold">🌍 Geography Expert!</h3>
                    <p>Outstanding geographical knowledge!</p>
                  </div>
                ) : score >= totalRounds * 50 ? (
                  <div className="text-blue-600">
                    <h3 className="text-xl font-bold">🗺️ Good Explorer!</h3>
                    <p>Nice geography skills!</p>
                  </div>
                ) : (
                  <div className="text-orange-600">
                    <h3 className="text-xl font-bold">🧭 Keep Exploring!</h3>
                    <p>Practice makes perfect!</p>
                  </div>
                )}
              </div>

              <Button onClick={resetGame}>
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
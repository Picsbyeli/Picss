import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Zap, Leaf, Flame, Droplets, Star, Heart, Sword, Shield, MapPin, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Classic Pokemon-style sound effects
const playClassicSound = (soundType: string) => {
  // Simulate classic Pokemon sound descriptions
  const soundDescriptions = {
    'confirm': '♪ Beep! ♪',
    'select': '♪ Click! ♪',
    'encounter': '♪ Da-da-da-DAA! ♪',
    'capture': '♪ Ding-ding-ding! ♪',
    'evolution': '♪ Congratulations! ♪'
  };
  
  console.log(`🔊 ${soundDescriptions[soundType as keyof typeof soundDescriptions] || '♪ Sound! ♪'}`);
};

interface BurblemonSpecies {
  id: number;
  name: string;
  category: string;
  elementType: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  evolutionLevel?: number;
  rarity: string;
  habitat?: string;
  personalityTraits: string[];
  catchRate: number;
  description?: string;
}

interface PlayerBurblemon {
  id: number;
  userId: number;
  speciesId: number;
  nickname?: string;
  level: number;
  experience: number;
  currentHp: number;
  maxHp: number;
  currentAttack: number;
  currentDefense: number;
  currentSpeed: number;
  moves: string[];
  isShiny: boolean;
  caughtAt: string;
  caughtLocation?: string;
  statusConditions: string[];
  personality?: string;
  isStarter: boolean;
}

interface MapZone {
  id: number;
  name: string;
  zoneType: string;
  difficultyLevel: number;
  description?: string;
  wildEncounterRate: number;
  requiredBadges: number;
  unlockMessage?: string;
}

const getElementIcon = (element: string) => {
  switch (element.toLowerCase()) {
    case 'electric': return <Zap className="h-4 w-4 text-yellow-500" />;
    case 'grass': return <Leaf className="h-4 w-4 text-green-500" />;
    case 'fire': return <Flame className="h-4 w-4 text-red-500" />;
    case 'water': return <Droplets className="h-4 w-4 text-blue-500" />;
    default: return <Star className="h-4 w-4 text-gray-500" />;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return 'bg-gray-100 text-gray-800';
    case 'uncommon': return 'bg-green-100 text-green-800';
    case 'rare': return 'bg-blue-100 text-blue-800';
    case 'epic': return 'bg-purple-100 text-purple-800';
    case 'legendary': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function BurblemonPage() {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('collection');
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log('🔍 Burblemon Auth State:', { 
      hasUser: !!user, 
      isGuest, 
      username: user?.username || 'no-user',
      shouldAllowAccess: !!(user || isGuest)
    });
  }, [user, isGuest]);
  const [showProfessorIntro, setShowProfessorIntro] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [selectedStarter, setSelectedStarter] = useState<BurblemonSpecies | null>(null);
  const [showWildEncounter, setShowWildEncounter] = useState(false);
  const [encounterPokemon, setEncounterPokemon] = useState<BurblemonSpecies | null>(null);

  // Fetch all species
  const { data: species = [], isLoading: speciesLoading } = useQuery<BurblemonSpecies[]>({
    queryKey: ['/api/burblemons/species'],
    enabled: !!user,
  });

  // Fetch player's Burblemons
  const { data: playerBurblemons = [], isLoading: burblemonsLoading } = useQuery<PlayerBurblemon[]>({
    queryKey: ['/api/burblemons/player', user?.id],
    enabled: !!user?.id,
  });

  // Fetch starter Burblemons
  const { data: starters = [] } = useQuery<PlayerBurblemon[]>({
    queryKey: ['/api/burblemons/player', user?.id, 'starters'],
    enabled: !!user?.id,
  });

  // Fetch map zones
  const { data: zones = [], isLoading: zonesLoading } = useQuery<MapZone[]>({
    queryKey: ['/api/map/zones'],
    enabled: !!user,
  });

  // Choose starter mutation
  const chooseStarterMutation = useMutation({
    mutationFn: async (speciesId: number) => {
      const speciesData = species.find(s => s.id === speciesId);
      if (!speciesData) throw new Error('Species not found');

      return apiRequest('POST', '/api/burblemons', {
        userId: user!.id,
        speciesId,
        nickname: speciesData.name,
        level: 5,
        experience: 0,
        currentHp: speciesData.baseHp,
        maxHp: speciesData.baseHp,
        currentAttack: speciesData.baseAttack,
        currentDefense: speciesData.baseDefense,
        currentSpeed: speciesData.baseSpeed,
        moves: ['Tackle', 'Quick Attack'],
        isShiny: Math.random() < 0.01, // 1% shiny chance
        caughtLocation: 'Tutorial Town',
        statusConditions: [],
        personality: speciesData.personalityTraits[0] || 'Brave',
        isStarter: true
      });
    },
    onSuccess: () => {
      playClassicSound('capture');
      queryClient.invalidateQueries({ queryKey: ['/api/burblemons/player'] });
      toast({
        title: "♪ Ding-ding-ding! ♪",
        description: `${selectedStarter?.name} was added to your collection! Your adventure begins now!`,
      });
      setSelectedTab('collection');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to choose starter",
        variant: "destructive",
      });
    },
  });

  const hasStarted = starters.length > 0;
  const starterSpecies = species.filter(s => s.category === 'Starter');

  // Professor introduction dialogue (inspired by Professor Oak)
  const playerName = user?.username || (isGuest ? "Trainer" : "New Trainer");
  const professorDialogue = [
    "Hello there! Welcome to the world of Burblemons!",
    "My name is Professor Bubble! People call me the Burblemon Prof!",
    "This world is inhabited by creatures called Burblemons!",
    "For some people, Burblemons are pets. Others use them for battles.",
    "Myself... I study Burblemons as a profession.",
    `${playerName}! Your very own Burblemon legend is about to unfold!`,
    "A world of dreams and adventures with Burblemons awaits! Let's go!"
  ];

  // Handle starter selection with classic confirmation
  const handleStarterSelection = (starter: BurblemonSpecies) => {
    playClassicSound('select');
    setSelectedStarter(starter);
  };

  const confirmStarterSelection = () => {
    if (selectedStarter) {
      playClassicSound('confirm');
      chooseStarterMutation.mutate(selectedStarter.id);
      setSelectedStarter(null);
    }
  };

  // Wild encounter simulation
  const triggerWildEncounter = (zone: MapZone) => {
    playClassicSound('select');
    
    // Simulate random encounter with classic Pokemon encounter rate
    if (Math.random() < zone.wildEncounterRate) {
      const randomSpecies = species[Math.floor(Math.random() * species.length)];
      setEncounterPokemon(randomSpecies);
      setShowWildEncounter(true);
      
      playClassicSound('encounter');
      
      toast({
        title: `♪ Da-da-da-DAA! ♪`,
        description: `A wild ${randomSpecies.name} appeared!`,
      });
    } else {
      toast({
        title: "...",
        description: "You searched through the grass but found no wild Burblemons.",
      });
    }
  };

  const closeWildEncounter = () => {
    setShowWildEncounter(false);
    setEncounterPokemon(null);
  };

  if (!user && !isGuest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to Burblemons!</CardTitle>
            <CardDescription>Please log in to start your creature collection adventure.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (speciesLoading || burblemonsLoading || zonesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your Burblemon adventure...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="burblemon-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="page-title">
          Burblemons <span className="text-2xl">⚡🍃🔥💧</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Collect, train, and evolve magical creatures in this Pokemon-like adventure!
        </p>
      </div>

      {/* Professor Introduction Modal */}
      {showProfessorIntro && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-testid="professor-intro">
          <Card className="max-w-2xl mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🧔 Professor Bubble</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-lg leading-relaxed font-mono">
                  {professorDialogue[introStep]}
                </p>
              </div>
              <div className="flex justify-between">
                {introStep > 0 && (
                  <Button variant="outline" onClick={() => setIntroStep(introStep - 1)}>
                    Back
                  </Button>
                )}
                <div className="flex-1" />
                {introStep < professorDialogue.length - 1 ? (
                  <Button onClick={() => setIntroStep(introStep + 1)}>
                    Continue ▶
                  </Button>
                ) : (
                  <Button onClick={() => setShowProfessorIntro(false)}>
                    Begin Adventure!
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Starter Confirmation Modal */}
      {selectedStarter && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-testid="starter-confirmation">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Confirm Your Choice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-lg font-mono leading-relaxed">
                  So! You want the {selectedStarter.elementType.toLowerCase()} Burblemon, {selectedStarter.name}?
                </p>
                <div className="mt-3 text-sm text-muted-foreground font-mono">
                  This Burblemon is really energetic!
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedStarter(null)} className="flex-1">
                  No, wait...
                </Button>
                <Button onClick={confirmStarterSelection} className="flex-1" disabled={chooseStarterMutation.isPending}>
                  {chooseStarterMutation.isPending ? "Choosing..." : "Yes!"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wild Encounter Modal */}
      {showWildEncounter && encounterPokemon && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" data-testid="wild-encounter">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Wild Encounter!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="text-center mb-3">
                  <div className="mx-auto mb-2 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-16 h-16 flex items-center justify-center">
                    {getElementIcon(encounterPokemon.elementType)}
                  </div>
                </div>
                <p className="text-lg font-mono leading-relaxed text-center">
                  A wild {encounterPokemon.name} appeared!
                </p>
                <div className="mt-3 text-sm text-muted-foreground text-center">
                  Level {Math.floor(Math.random() * 10) + 1} • {encounterPokemon.elementType} Type
                </div>
                <div className="mt-2 text-xs text-center">
                  {encounterPokemon.description}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={closeWildEncounter}>
                  Run Away
                </Button>
                <Button onClick={closeWildEncounter}>
                  Battle! (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasStarted ? (
        <Card className="max-w-4xl mx-auto" data-testid="starter-selection">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              Professor Bubble's Laboratory
              <Button 
                variant="link" 
                onClick={() => setShowProfessorIntro(true)}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                📖 Hear Introduction
              </Button>
            </CardTitle>
            <CardDescription className="text-lg">
              Here are 3 Burblemons! They are inside the Burble Balls. You can have one! Choose!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {starterSpecies.map((starter) => (
                <Card 
                  key={starter.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
                  onClick={() => handleStarterSelection(starter)}
                  data-testid={`starter-${starter.name.toLowerCase()}`}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto mb-2 p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-16 h-16 flex items-center justify-center">
                      {getElementIcon(starter.elementType)}
                    </div>
                    <CardTitle className="text-lg">{starter.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2">
                      {getElementIcon(starter.elementType)}
                      <span className="text-sm font-medium">{starter.elementType}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{starter.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          HP: {starter.baseHp}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sword className="h-3 w-3 text-orange-500" />
                          ATK: {starter.baseAttack}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-blue-500" />
                          DEF: {starter.baseDefense}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          SPD: {starter.baseSpeed}
                        </span>
                      </div>
                    </div>
                    <Badge className={`mt-3 w-full justify-center ${getRarityColor(starter.rarity)}`}>
                      {starter.rarity}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            {chooseStarterMutation.isPending && (
              <div className="text-center mt-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Choosing your starter...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-blue-100 dark:bg-blue-900">
            <TabsTrigger 
              value="collection" 
              data-testid="tab-collection"
              onClick={() => playClassicSound('select')}
              className="font-mono text-sm"
            >
              📦 BURBLEMONS
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              data-testid="tab-map"
              onClick={() => playClassicSound('select')}
              className="font-mono text-sm"
            >
              🗺️ TOWN MAP
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              data-testid="tab-inventory"
              onClick={() => playClassicSound('select')}
              className="font-mono text-sm"
            >
              🎒 BAG
            </TabsTrigger>
            <TabsTrigger 
              value="battles" 
              data-testid="tab-battles"
              onClick={() => playClassicSound('select')}
              className="font-mono text-sm"
            >
              ⚔️ TRAINER
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4" data-testid="collection-title">
                Your Burblemon Collection ({playerBurblemons.length})
              </h2>
              
              {playerBurblemons.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No Burblemons in your collection yet!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Explore the world map to find and catch wild Burblemons.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {playerBurblemons.map((burblemon) => {
                    const speciesData = species.find(s => s.id === burblemon.speciesId);
                    const expNeeded = burblemon.level * 100;
                    const expProgress = (burblemon.experience / expNeeded) * 100;
                    
                    return (
                      <Card key={burblemon.id} className="hover:shadow-lg transition-shadow" data-testid={`burblemon-${burblemon.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {burblemon.nickname || speciesData?.name}
                              {burblemon.isShiny && <Star className="h-4 w-4 text-yellow-500" />}
                              {burblemon.isStarter && <Badge variant="secondary" className="text-xs">Starter</Badge>}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              {getElementIcon(speciesData?.elementType || '')}
                              <span className="text-sm text-muted-foreground">Lv.{burblemon.level}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>HP: {burblemon.currentHp}/{burblemon.maxHp}</span>
                              <span className={burblemon.currentHp < burblemon.maxHp * 0.3 ? 'text-red-500' : 'text-green-500'}>
                                {Math.round((burblemon.currentHp / burblemon.maxHp) * 100)}%
                              </span>
                            </div>
                            <Progress value={(burblemon.currentHp / burblemon.maxHp) * 100} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>EXP: {burblemon.experience}/{expNeeded}</span>
                              <span>{Math.round(expProgress)}%</span>
                            </div>
                            <Progress value={expProgress} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Sword className="h-3 w-3 text-orange-500" />
                              ATK: {burblemon.currentAttack}
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-blue-500" />
                              DEF: {burblemon.currentDefense}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              SPD: {burblemon.currentSpeed}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-500" />
                              {burblemon.caughtLocation || 'Unknown'}
                            </div>
                          </div>

                          {burblemon.moves.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Moves:</p>
                              <div className="flex flex-wrap gap-1">
                                {burblemon.moves.slice(0, 4).map((move, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                    {move}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs" data-testid={`heal-${burblemon.id}`}>
                              Heal
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-xs" data-testid={`train-${burblemon.id}`}>
                              Train
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4" data-testid="map-title">World Map</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <Card key={zone.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`zone-${zone.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {zone.name}
                        <Badge variant={zone.requiredBadges === 0 ? 'default' : 'secondary'}>
                          Lv.{zone.difficultyLevel}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{zone.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Zone Type:</span>
                          <span className="capitalize font-medium">{zone.zoneType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wild Encounter Rate:</span>
                          <span className="font-medium">{Math.round(zone.wildEncounterRate * 100)}%</span>
                        </div>
                        {zone.requiredBadges > 0 && (
                          <div className="flex justify-between text-amber-600">
                            <span>Badges Required:</span>
                            <span className="font-medium">{zone.requiredBadges}</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        data-testid={`explore-${zone.id}`}
                        onClick={() => triggerWildEncounter(zone)}
                      >
                        Explore Zone
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4" data-testid="inventory-title">Inventory & Shop</h2>
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Inventory system coming soon!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Buy items, manage your inventory, and use items on your Burblemons.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="battles" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4" data-testid="battles-title">Battle Training</h2>
              
              {/* Solo Dungeon Adventure */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sword className="h-5 w-5 text-orange-500" />
                    Solo Dungeon Adventure
                  </CardTitle>
                  <CardDescription>
                    Battle monsters in quiz-based dungeons! Answer questions correctly to defeat enemies and gain XP for your Burblemons.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Gain XP & Level Up</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Quiz-Based Combat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>Find Rare Loot</span>
                    </div>
                  </div>
                  
                  <Link href="/solo-dungeon">
                    <Button 
                      className="w-full text-lg py-6"
                      data-testid="button-enter-dungeon"
                      onClick={() => playClassicSound('select')}
                    >
                      ⚔️ Enter Solo Dungeon!
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Coming Soon Features */}
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Trainer Battles & More (Coming Soon)
                  </CardTitle>
                  <CardDescription>
                    Challenge other trainers, battle wild Burblemons, and track your complete battle history.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon...
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
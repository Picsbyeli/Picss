import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Zap, Flame, Droplets, Leaf, Star, Sword, Shield, Trophy, Gift, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface PlayerBurblemon {
  id: number;
  speciesId: number;
  nickname?: string;
  level: number;
  xp: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  happiness: number;
  isStarter: boolean;
}

interface BurblemonSpecies {
  id: number;
  name: string;
  category: string;
  elementType: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  description?: string;
}

interface QuizTopic {
  id: number;
  name: string;
  description?: string;
  colorTheme: string;
  iconEmoji: string;
}

interface QuizQuestion {
  id: number;
  topicId: number;
  questionText: string;
  questionType: string;
  choices?: string;
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  energyReward: number;
}

interface DungeonRun {
  id: number;
  playerId: number;
  activeBurblemonId?: number;
  characterType: string;
  topicId: number;
  playerHp: number;
  playerMaxHp: number;
  playerEnergy: number;
  enemyHp: number;
  enemyMaxHp: number;
  currentEnemyType: string;
  questionsAnswered: number;
  correctAnswers: number;
  enemiesDefeated: number;
  isActive: boolean;
}

interface BattleResult {
  isCorrect: boolean;
  explanation?: string;
  energyReward: number;
  enemyDefeated?: boolean;
  playerDefeated?: boolean;
  xpGained?: number;
}

interface ExplorationResult {
  success: boolean;
  message: string;
  itemsFound: ItemWithQuantity[];
  totalItems: number;
}

interface ItemWithQuantity {
  id: number;
  name: string;
  itemType: string;
  description: string;
  buyPrice: number;
  icon?: string;
  quantityFound: number;
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

export default function SoloDungeonPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedBurblemon, setSelectedBurblemon] = useState<PlayerBurblemon | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [battlePhase, setBattlePhase] = useState<'select' | 'battle' | 'victory' | 'defeat'>('select');
  const [showPostBattleChoice, setShowPostBattleChoice] = useState(false);
  const [lastBattleXP, setLastBattleXP] = useState(0);
  const [showLootResults, setShowLootResults] = useState(false);
  const [lootResults, setLootResults] = useState<ExplorationResult | null>(null);

  // Fetch player's Burblemons
  const { data: playerBurblemons = [] } = useQuery<PlayerBurblemon[]>({
    queryKey: ['/api/burblemons/player', user?.id],
    enabled: !!user?.id,
  });

  // Fetch Burblemon species
  const { data: species = [] } = useQuery<BurblemonSpecies[]>({
    queryKey: ['/api/burblemons/species'],
    enabled: !!user,
  });

  // Fetch quiz topics
  const { data: topics = [] } = useQuery<QuizTopic[]>({
    queryKey: ['/api/quiz/topics'],
    enabled: !!user,
  });

  // Fetch current active dungeon run
  const { data: activeDungeon, isLoading: dungeonLoading } = useQuery<DungeonRun>({
    queryKey: ['/api/dungeon/active', user?.id],
    enabled: !!user?.id,
  });

  // Start new dungeon mutation
  const startDungeonMutation = useMutation({
    mutationFn: async ({ burblemonId, topicId }: { burblemonId: number; topicId: number }) => {
      return apiRequest('POST', '/api/dungeon/start', {
        playerId: user!.id,
        activeBurblemonId: burblemonId,
        topicId,
        characterType: 'adventurer'
      });
    },
    onSuccess: (newDungeon) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dungeon/active'] });
      setBattlePhase('battle');
      toast({
        title: "⚔️ Dungeon Started!",
        description: `${selectedBurblemon?.nickname} enters the dungeon!`,
      });
    },
  });

  // Get next question mutation
  const nextQuestionMutation = useMutation({
    mutationFn: async (dungeonId: number): Promise<QuizQuestion> => {
      return apiRequest('GET', `/api/dungeon/${dungeonId}/question`);
    },
    onSuccess: (question) => {
      setCurrentQuestion(question);
      setCurrentAnswer('');
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ dungeonId, questionId, answer }: { dungeonId: number; questionId: number; answer: string }): Promise<BattleResult> => {
      return apiRequest('POST', `/api/dungeon/${dungeonId}/answer`, {
        questionId,
        answer,
      });
    },
    onSuccess: (result) => {
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ['/api/dungeon/active'] });
      
      if (result.isCorrect) {
        toast({
          title: "⚡ Correct!",
          description: `+${result.energyReward} Energy! ${result.explanation}`,
        });
        
        // Check if enemy is defeated
        if (result.enemyDefeated) {
          setLastBattleXP(result.xpGained || 50); // Default 50 XP per enemy
          setShowPostBattleChoice(true);
          setBattlePhase('victory');
        }
      } else {
        toast({
          title: "❌ Incorrect",
          description: result.explanation,
          variant: "destructive",
        });
        
        if (result.playerDefeated) {
          setBattlePhase('defeat');
        }
      }
    },
  });

  // Continue battling choice
  const handleContinueBattle = () => {
    setShowPostBattleChoice(false);
    setBattlePhase('battle');
    if (activeDungeon?.id) {
      nextQuestionMutation.mutate(activeDungeon.id);
    }
  };

  // Explore for loot mutation
  const exploreLootMutation = useMutation({
    mutationFn: async (dungeonId: number): Promise<ExplorationResult> => {
      return apiRequest('POST', `/api/dungeon/${dungeonId}/explore`);
    },
    onSuccess: (result) => {
      setLootResults(result);
      setShowLootResults(true);
      queryClient.invalidateQueries({ queryKey: ['/api/dungeon/active'] });
      
      toast({
        title: "🎁 Treasure Found!",
        description: `Found ${result.totalItems} item${result.totalItems > 1 ? 's' : ''}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Exploration Failed",
        description: error.message || "Could not explore the dungeon",
        variant: "destructive",
      });
    },
  });

  // Explore for loot choice
  const handleExploreLoot = () => {
    setShowPostBattleChoice(false);
    if (activeDungeon?.id) {
      exploreLootMutation.mutate(activeDungeon.id);
    }
  };

  // Start battle
  const handleStartBattle = () => {
    if (selectedBurblemon && selectedTopic) {
      startDungeonMutation.mutate({
        burblemonId: selectedBurblemon.id,
        topicId: selectedTopic.id,
      });
    }
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (activeDungeon?.id && currentQuestion && currentAnswer.trim()) {
      submitAnswerMutation.mutate({
        dungeonId: activeDungeon.id,
        questionId: currentQuestion.id,
        answer: currentAnswer.trim(),
      });
    }
  };

  // Get species data for selected Burblemon
  const selectedSpecies = selectedBurblemon 
    ? species.find(s => s.id === selectedBurblemon.speciesId)
    : null;

  // Calculate XP needed for next level
  const xpForNextLevel = selectedBurblemon ? selectedBurblemon.level * 100 : 0;
  const xpProgress = selectedBurblemon ? (selectedBurblemon.xp / xpForNextLevel) * 100 : 0;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Solo Dungeon</CardTitle>
            <CardDescription>Please log in to explore dungeons with your Burblemons.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="solo-dungeon-title">
          Solo Dungeon ⚔️🏰
        </h1>
        <p className="text-xl text-muted-foreground">
          Battle monsters, gain XP, and find treasure with your Burblemons!
        </p>
      </div>

      {/* Post-Battle Choice Dialog */}
      <Dialog open={showPostBattleChoice} onOpenChange={setShowPostBattleChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Victory!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                Enemy Defeated! 
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedBurblemon?.nickname} gained {lastBattleXP} XP!
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">What would you like to do next?</p>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={handleContinueBattle}
                  className="flex items-center gap-2"
                  data-testid="button-continue-battle"
                >
                  <Sword className="h-4 w-4" />
                  Continue Fighting
                </Button>
                <Button 
                  onClick={handleExploreLoot}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-explore-loot"
                >
                  <Gift className="h-4 w-4" />
                  Explore for Loot
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loot Results Dialog */}
      <Dialog open={showLootResults} onOpenChange={setShowLootResults}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-green-500" />
              Exploration Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {lootResults?.message}
              </p>
              <p className="text-sm text-muted-foreground">
                You found {lootResults?.totalItems} item{lootResults?.totalItems !== 1 ? 's' : ''}!
              </p>
            </div>
            
            {lootResults?.itemsFound && lootResults.itemsFound.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Items Found:</h3>
                <div className="grid gap-2">
                  {lootResults.itemsFound.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {item.itemType === 'healing' && <Heart className="h-4 w-4 text-red-500" />}
                          {item.itemType === 'utility' && <Package className="h-4 w-4 text-blue-500" />}
                          {item.itemType === 'treasure' && <Star className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">x{item.quantityFound}</div>
                        <div className="text-sm text-muted-foreground">${item.buyPrice} each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => setShowLootResults(false)}
                className="w-full"
                data-testid="button-close-loot-results"
              >
                Continue Adventure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={battlePhase === 'select' ? 'select' : 'battle'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-purple-100 dark:bg-purple-900">
          <TabsTrigger value="select" data-testid="tab-select">
            🎯 Prepare
          </TabsTrigger>
          <TabsTrigger value="battle" data-testid="tab-battle" disabled={battlePhase === 'select'}>
            ⚔️ Battle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Burblemon Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Burblemon</CardTitle>
                <CardDescription>Select a healthy Burblemon for battle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {playerBurblemons.filter(b => b.currentHp > 0).map((burblemon) => {
                  const speciesData = species.find(s => s.id === burblemon.speciesId);
                  return (
                    <Card 
                      key={burblemon.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedBurblemon?.id === burblemon.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedBurblemon(burblemon)}
                      data-testid={`burblemon-${burblemon.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {getElementIcon(speciesData?.elementType || '')}
                              <span className="font-semibold">{burblemon.nickname || speciesData?.name}</span>
                            </div>
                            <Badge variant="secondary">Lv.{burblemon.level}</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>HP: {burblemon.currentHp}/{burblemon.maxHp}</span>
                              <span>{Math.round((burblemon.currentHp / burblemon.maxHp) * 100)}%</span>
                            </div>
                            <Progress value={(burblemon.currentHp / burblemon.maxHp) * 100} className="h-2" />
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <Sword className="h-3 w-3" />
                              ATK: {burblemon.attack}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              DEF: {burblemon.defense}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              SPD: {burblemon.speed}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Topic Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Battle Topic</CardTitle>
                <CardDescription>Pick your area of expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topics.map((topic) => (
                  <Card 
                    key={topic.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedTopic?.id === topic.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTopic(topic)}
                    data-testid={`topic-${topic.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{topic.iconEmoji}</div>
                        <div>
                          <h3 className="font-semibold">{topic.name}</h3>
                          <p className="text-sm text-muted-foreground">{topic.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Start Battle Button */}
          <Card>
            <CardContent className="p-6 text-center">
              <Button 
                onClick={handleStartBattle}
                disabled={!selectedBurblemon || !selectedTopic || startDungeonMutation.isPending}
                size="lg"
                className="text-lg px-8 py-6"
                data-testid="button-start-dungeon"
              >
                {startDungeonMutation.isPending ? "Starting..." : "Enter Dungeon! ⚔️"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="battle" className="space-y-6">
          {activeDungeon && selectedBurblemon && selectedSpecies && (
            <>
              {/* Battle Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getElementIcon(selectedSpecies.elementType)}
                      {selectedBurblemon.nickname || selectedSpecies.name}
                      <Badge>Lv.{selectedBurblemon.level}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>HP</span>
                        <span>{selectedBurblemon.currentHp}/{selectedBurblemon.maxHp}</span>
                      </div>
                      <Progress value={(selectedBurblemon.currentHp / selectedBurblemon.maxHp) * 100} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>XP</span>
                        <span>{selectedBurblemon.xp}/{xpForNextLevel}</span>
                      </div>
                      <Progress value={xpProgress} className="h-2 bg-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Enemy Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      👹 {activeDungeon.currentEnemyType === 'boss' ? 'Boss' : 'Grunt'} Enemy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>HP</span>
                        <span>{activeDungeon.enemyHp}/{activeDungeon.enemyMaxHp}</span>
                      </div>
                      <Progress value={(activeDungeon.enemyHp / activeDungeon.enemyMaxHp) * 100} className="h-3 bg-red-200" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Enemies defeated: {activeDungeon.enemiesDefeated}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Battle Question */}
              {currentQuestion && (
                <Card>
                  <CardHeader>
                    <CardTitle>Battle Question</CardTitle>
                    <Badge className={`w-fit ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg">{currentQuestion.questionText}</p>
                    
                    {currentQuestion.questionType === 'multiple_choice' && currentQuestion.choices ? (
                      <div className="grid grid-cols-1 gap-2">
                        {JSON.parse(currentQuestion.choices).map((choice: string, index: number) => (
                          <Button
                            key={index}
                            variant={currentAnswer === choice ? 'default' : 'outline'}
                            onClick={() => setCurrentAnswer(choice)}
                            className="justify-start"
                            data-testid={`choice-${index}`}
                          >
                            {choice}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your answer..."
                        data-testid="text-answer-input"
                      />
                    )}

                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim() || submitAnswerMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-answer"
                    >
                      {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer ⚡"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Get Next Question */}
              {!currentQuestion && activeDungeon.isActive && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Button 
                      onClick={() => nextQuestionMutation.mutate(activeDungeon.id)}
                      disabled={nextQuestionMutation.isPending}
                      size="lg"
                      data-testid="button-next-question"
                    >
                      {nextQuestionMutation.isPending ? "Loading..." : "Next Battle! ⚔️"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
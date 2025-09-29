import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Users, Trophy, Clock, Zap, Sword, Shield, Battery, Heart, ArrowLeft, Lightbulb, Sparkles, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { WrongAnswerModal } from '@/components/modals/wrong-answer';
import { motion, AnimatePresence } from 'framer-motion';

// Import character images
import baseSprite from '@assets/image_1757430101336.png';

// Pokemon-like Character configurations for Dungeon Battle System
const CHARACTER_OPTIONS = [
  {
    id: 'psychic_sage',
    name: 'Psychic Sage',
    type: 'Psychic',
    emoji: '🧠',
    description: 'Master of mental powers with energy manipulation abilities',
    baseStats: {
      hp: 75,
      attack: 85,
      defense: 60,
      speed: 70,
      energy: 100
    },
    abilities: [
      { name: 'Mind Blast', damage: 25, energyCost: 30, description: 'Powerful psychic attack' },
      { name: 'Energy Drain', damage: 15, energyCost: 20, special: 'steals_energy', description: 'Drains enemy energy' },
      { name: 'Barrier', damage: 0, energyCost: 25, special: 'defense_boost', description: 'Increases defense for 2 turns' },
      { name: 'Heal', damage: 0, energyCost: 40, special: 'heal_self', description: 'Restores 30 HP' }
    ],
    strengths: ['Fighting', 'Poison'],
    weaknesses: ['Dark', 'Bug']
  },
  {
    id: 'shadow_striker',
    name: 'Shadow Striker',
    type: 'Dark',
    emoji: '🥷',
    description: 'High-risk, high-reward assassin with critical strike abilities',
    baseStats: {
      hp: 60,
      attack: 95,
      defense: 50,
      speed: 90,
      energy: 80
    },
    abilities: [
      { name: 'Shadow Strike', damage: 30, energyCost: 35, special: 'crit_chance', description: '50% chance for double damage' },
      { name: 'Poison Dart', damage: 20, energyCost: 25, special: 'poison', description: 'Deals damage over time' },
      { name: 'Vanish', damage: 0, energyCost: 30, special: 'dodge_next', description: 'Avoid next attack' },
      { name: 'Berserk', damage: 40, energyCost: 50, special: 'self_damage', description: 'Powerful attack that hurts self' }
    ],
    strengths: ['Psychic', 'Ghost'],
    weaknesses: ['Fighting', 'Bug']
  },
  {
    id: 'iron_guardian',
    name: 'Iron Guardian',
    type: 'Steel',
    emoji: '🛡️',
    description: 'Heavily armored defender with protective abilities',
    baseStats: {
      hp: 120,
      attack: 70,
      defense: 100,
      speed: 40,
      energy: 90
    },
    abilities: [
      { name: 'Steel Slam', damage: 25, energyCost: 30, description: 'Heavy metallic attack' },
      { name: 'Iron Defense', damage: 0, energyCost: 20, special: 'damage_reduction', description: 'Reduce incoming damage' },
      { name: 'Taunt', damage: 0, energyCost: 15, special: 'force_target', description: 'Forces enemy to attack you' },
      { name: 'Shield Bash', damage: 35, energyCost: 40, special: 'stun', description: 'Attack that may stun enemy' }
    ],
    strengths: ['Rock', 'Ice'],
    weaknesses: ['Fire', 'Fighting']
  },
  {
    id: 'mirror_mage',
    name: 'Mirror Mage',
    type: 'Psychic',
    emoji: '🪞',
    description: 'Mystical spellcaster with reflection and counter abilities',
    baseStats: {
      hp: 70,
      attack: 75,
      defense: 80,
      speed: 85,
      energy: 95
    },
    abilities: [
      { name: 'Mirror Shot', damage: 20, energyCost: 25, description: 'Reflects light energy' },
      { name: 'Counter Spell', damage: 0, energyCost: 30, special: 'reflect_damage', description: 'Next attack reflects back' },
      { name: 'Illusion', damage: 0, energyCost: 20, special: 'confuse', description: 'May cause enemy to hit themselves' },
      { name: 'Prism Beam', damage: 35, energyCost: 45, special: 'type_change', description: 'Changes damage type randomly' }
    ],
    strengths: ['Fighting', 'Poison'],
    weaknesses: ['Ghost', 'Dark']
  },
  {
    id: 'elemental_warrior',
    name: 'Elemental Warrior',
    type: 'Normal',
    emoji: '⚡',
    image: baseSprite,
    description: 'Versatile fighter with balanced elemental abilities',
    baseStats: {
      hp: 80,
      attack: 80,
      defense: 70,
      speed: 75,
      energy: 85
    },
    abilities: [
      { name: 'Elemental Strike', damage: 25, energyCost: 30, description: 'Adapts to enemy weakness' },
      { name: 'Quick Attack', damage: 15, energyCost: 15, special: 'always_first', description: 'Always goes first' },
      { name: 'Meditate', damage: 0, energyCost: 0, special: 'restore_energy', description: 'Restores 25 energy' },
      { name: 'Combo Attack', damage: 20, energyCost: 35, special: 'multi_hit', description: 'Hits 2-3 times' }
    ],
    strengths: [],
    weaknesses: ['Fighting']
  }
];

// Dungeon Enemy Types
const DUNGEON_ENEMIES = {
  grunts: [
    { name: 'Shadow Grunt', type: 'Dark', hp: 40, attack: 20, defense: 15, abilities: ['Dark Slash'] },
    { name: 'Rock Minion', type: 'Rock', hp: 50, attack: 18, defense: 25, abilities: ['Stone Throw'] },
    { name: 'Fire Imp', type: 'Fire', hp: 35, attack: 25, defense: 10, abilities: ['Ember'] },
    { name: 'Ice Shard', type: 'Ice', hp: 30, attack: 22, defense: 20, abilities: ['Frost Bite'] }
  ],
  bosses: [
    { 
      name: 'Dungeon Lord', 
      type: 'Dark', 
      hp: 150, 
      attack: 35, 
      defense: 30, 
      abilities: ['Shadow Storm', 'Dark Barrier', 'Soul Drain'],
      phase2: { name: 'Enraged Form', hpThreshold: 50, attackBoost: 15 }
    },
    { 
      name: 'Crystal Golem', 
      type: 'Rock', 
      hp: 200, 
      attack: 30, 
      defense: 45, 
      abilities: ['Boulder Smash', 'Crystal Shield', 'Earthquake'],
      phase2: { name: 'Shattered Core', hpThreshold: 60, speedBoost: 20 }
    }
  ]
};

// Turn-based Combat State Interface
interface CombatState {
  playerTurn: boolean;
  turnNumber: number;
  playerCharacter: any;
  currentEnemy: any;
  combatLog: string[];
  statusEffects: {
    player: any[];
    enemy: any[];
  };
  dungeonLevel: number;
  defeatedEnemies: number;
  isBossFight: boolean;
}

interface GameSession {
  id: number;
  sessionCode: string;
  hostUserId: number;
  status: 'waiting' | 'active' | 'finished';
  maxPlayers: number;
  currentQuestionIndex: number;
  riddleIds: string;
  categoryId: number | null;
  difficulty: string | null;
  timePerQuestion: number;
  participants: GameParticipant[];
  category?: { name: string; colorClass: string };
}

interface GameParticipant {
  id: number;
  userId: number;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  isReady: boolean;
  hp: number;
  maxHp: number;
  hasShield: boolean;
  chargePower: number;
  lastAction: string | null;
  characterType: string;
  energy: number;
  user: { username: string };
}

interface CurrentQuestion {
  id: number;
  question: string;
  answer: string;
  hint: string | null;
  difficulty: string;
}

// Battle Move Animation Component
const BattleMoveAnimation = ({ moves, isVisible }: { moves: any[], isVisible: boolean }) => {
  if (!isVisible || moves.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 pointer-events-none z-50 max-w-sm">
      <div className="space-y-2">
        {moves.map((move, index) => (
          <div 
            key={index} 
            className={`transform transition-all duration-300 animate-in slide-in-from-right
              ${move.type === 'hp_loss' ? 'bg-red-900/90 border border-red-500' : 'bg-purple-900/90 border border-purple-500'} 
              rounded-lg p-3 backdrop-blur-sm shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${move.type === 'hp_loss' ? 'bg-red-400' : 'bg-purple-400'}`}></div>
                <div>
                  <div className="text-white font-medium text-sm">{move.playerName}</div>
                  <div className="text-gray-300 text-xs">{move.reason}</div>
                </div>
              </div>
              <div className={`font-bold ${move.type === 'hp_loss' ? 'text-red-400' : 'text-purple-400'} ml-3`}>
                {move.type === 'hp_loss' ? '-' : '+'}{move.amount} {move.type === 'hp_loss' ? 'HP' : 'Energy'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Contextual Game Hint Animation Component
const ContextualGameHint = ({ 
  isVisible, 
  type, 
  message, 
  onDismiss 
}: { 
  isVisible: boolean, 
  type: 'time' | 'wrong' | 'energy' | 'general', 
  message: string, 
  onDismiss: () => void 
}) => {
  if (!isVisible) return null;
  
  const getHintConfig = () => {
    switch (type) {
      case 'time':
        return {
          icon: Clock,
          color: 'from-orange-500 to-red-500',
          bg: 'bg-orange-900/90 border-orange-400',
          iconColor: 'text-orange-300',
          animation: 'animate-pulse'
        };
      case 'wrong':
        return {
          icon: Lightbulb,
          color: 'from-yellow-500 to-orange-500',
          bg: 'bg-yellow-900/90 border-yellow-400',
          iconColor: 'text-yellow-300',
          animation: 'animate-bounce'
        };
      case 'energy':
        return {
          icon: Zap,
          color: 'from-purple-500 to-blue-500',
          bg: 'bg-purple-900/90 border-purple-400',
          iconColor: 'text-purple-300',
          animation: 'animate-pulse'
        };
      default:
        return {
          icon: Sparkles,
          color: 'from-blue-500 to-cyan-500',
          bg: 'bg-blue-900/90 border-blue-400',
          iconColor: 'text-blue-300',
          animation: 'animate-pulse'
        };
    }
  };
  
  const config = getHintConfig();
  const IconComponent = config.icon;
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
      <div className={`${config.bg} border-2 rounded-lg p-6 max-w-md w-full mx-4 backdrop-blur-sm shadow-2xl
        animate-in fade-in-0 zoom-in-95 duration-300`}>
        <div className="flex items-start space-x-4">
          <div className={`${config.animation} p-2 rounded-full bg-gradient-to-r ${config.color}`}>
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold mb-2">
              {type === 'time' ? 'Time Running Out!' :
               type === 'wrong' ? 'Need a Hint?' :
               type === 'energy' ? 'Energy Tip!' :
               'Game Hint'}
            </h3>
            <p className="text-gray-200 text-sm mb-4">{message}</p>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={onDismiss} className="text-xs">
                Got it!
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MultiplayerPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Visual damage animation helper functions
  const triggerDamageAnimation = (amount: number, type: 'player' | 'enemy') => {
    const id = Math.random().toString(36).substr(2, 9);
    setDamageNumbers(prev => [...prev, { id, amount, type, timestamp: Date.now() }]);
    
    // Trigger screen shake for significant damage
    if (amount >= 20) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }
    
    // Trigger health flash
    if (type === 'player') {
      setHealthFlash(prev => ({ ...prev, player: true }));
      setTimeout(() => setHealthFlash(prev => ({ ...prev, player: false })), 300);
    } else {
      setHealthFlash(prev => ({ ...prev, enemy: true }));
      setTimeout(() => setHealthFlash(prev => ({ ...prev, enemy: false })), 300);
    }
    
    // Remove damage number after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 2000);
  };

  const triggerHealAnimation = (amount: number, type: 'player' | 'enemy') => {
    const id = Math.random().toString(36).substr(2, 9);
    setDamageNumbers(prev => [...prev, { id, amount: -amount, type, timestamp: Date.now() }]); // Negative for heal
    
    // Remove heal number after animation
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 2000);
  };
  const wsRef = useRef<WebSocket | null>(null);

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow guest access for solo dungeon, but require auth for multiplayer features
  const isGuestMode = !user;
  
  const [gameMode, setGameMode] = useState<'menu' | 'create' | 'join' | 'difficulty-select' | 'lobby' | 'character-select' | 'waiting-for-start' | 'playing' | 'action-select' | 'battle-result' | 'finished'>('menu');
  const [sessionCode, setSessionCode] = useState('');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [userAnswer, setUserAnswer] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [showMoveAnimations, setShowMoveAnimations] = useState(false);
  const [currentMoves, setCurrentMoves] = useState<any[]>([]);
  const [showContextualHint, setShowContextualHint] = useState(false);
  const [contextualHintType, setContextualHintType] = useState<'time' | 'wrong' | 'energy' | 'general'>('general');
  const [hintMessage, setHintMessage] = useState('');
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);
  const [pendingBattleAction, setPendingBattleAction] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [wasAnswerCorrect, setWasAnswerCorrect] = useState<boolean>(false);
  const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Quiz integration for combat
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<any>(null);
  const [pendingAbility, setPendingAbility] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [hasSelectedSprite, setHasSelectedSprite] = useState(false);
  const [actionTimer, setActionTimer] = useState(15);
  const [isWrongModalOpen, setIsWrongModalOpen] = useState(false);
  const [lastUserAnswer, setLastUserAnswer] = useState('');
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const MAX_ATTEMPTS = 3;
  
  // Visual damage animation states for enhanced health bars
  const [damageNumbers, setDamageNumbers] = useState<Array<{id: string, amount: number, type: 'player' | 'enemy', timestamp: number}>>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [healthFlash, setHealthFlash] = useState<{player: boolean, enemy: boolean}>({player: false, enemy: false});
  
  // Turn-based Dungeon Combat State
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [dungeonMode, setDungeonMode] = useState<'category-select' | 'character-select' | 'dungeon-lobby' | 'combat' | 'victory'>('category-select');
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  // Turn-based Combat Functions
  const initializeDungeonCombat = (character: any) => {
    const randomGrunt = DUNGEON_ENEMIES.grunts[Math.floor(Math.random() * DUNGEON_ENEMIES.grunts.length)];
    setCombatState({
      playerTurn: true,
      turnNumber: 1,
      playerCharacter: {
        ...character,
        currentHp: character.baseStats.hp,
        currentEnergy: character.baseStats.energy,
        statusEffects: []
      },
      currentEnemy: {
        ...randomGrunt,
        currentHp: randomGrunt.hp,
        statusEffects: []
      },
      combatLog: [`You encounter a ${randomGrunt.name}!`],
      statusEffects: { player: [], enemy: [] },
      dungeonLevel: 1,
      defeatedEnemies: 0,
      isBossFight: false
    });
    setDungeonMode('combat');
  };

  // Handle quiz answer submission
  const handleQuizAnswer = async () => {
    if (!currentQuizQuestion || !pendingAbility || !quizAnswer.trim()) return;

    setIsSubmittingAnswer(true);
    
    try {
      // Validate answer with backend
      const response = await apiRequest('POST', '/api/quiz/validate-answer', {
        questionId: currentQuizQuestion.id,
        userAnswer: quizAnswer.trim()
      });
      
      const result = await response.json();
      
      if (result.isCorrect) {
        // Correct answer - execute the ability with energy bonus
        setShowQuizModal(false);
        
        // Store energy bonus to apply after ability execution
        const energyBonus = result.energyReward || 15;
        
        // Execute ability and then apply energy bonus
        executePlayerTurnWithQuizBonus(pendingAbility.name, energyBonus);
      } else {
        // Wrong answer - show feedback but don't execute ability
        toast({
          title: "Incorrect Answer",
          description: `The correct answer was: ${result.correctAnswer || currentQuizQuestion.correctAnswer}`,
          variant: "destructive",
        });
        setShowQuizModal(false);
        // Player loses their turn for wrong answer
      }
    } catch (error) {
      console.error('Error validating quiz answer:', error);
      toast({
        title: "Error",
        description: "Failed to validate answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAnswer(false);
      setCurrentQuizQuestion(null);
      setPendingAbility(null);
      setQuizAnswer('');
    }
  };

  // Present quiz question before ability execution
  const initiateAbilityWithQuiz = (abilityName: string) => {
    if (!combatState || !combatState.playerTurn) return;

    const ability = selectedCharacter.abilities.find((a: any) => a.name === abilityName);
    if (!ability) return;

    // Check if we have quiz questions for this category
    if (!quizQuestions || (Array.isArray(quizQuestions) && quizQuestions.length === 0)) {
      // Fallback to old system if no questions available
      executePlayerTurn(abilityName);
      return;
    }

    // Select a random question from the available questions
    const questionArray = Array.isArray(quizQuestions) ? quizQuestions : [];
    const randomQuestion = questionArray[Math.floor(Math.random() * questionArray.length)];
    
    // Set up quiz modal
    setCurrentQuizQuestion(randomQuestion);
    setPendingAbility(ability);
    setQuizAnswer('');
    setShowQuizModal(true);
  };

  // Original execute function (now used after correct quiz answers)
  // Execute player turn with quiz energy bonus (new quiz-driven system)
  const executePlayerTurnWithQuizBonus = (abilityName: string, energyBonus: number) => {
    if (!combatState || !combatState.playerTurn) return;

    const ability = selectedCharacter.abilities.find((a: any) => a.name === abilityName);
    if (!ability) return;

    let damage = ability.damage;
    let newCombatState = { ...combatState };

    // Energy validation - energy must be earned through correct quiz answers
    if (newCombatState.playerCharacter.currentEnergy < ability.energyCost) {
      newCombatState.combatLog.push(`Not enough energy! Need ${ability.energyCost} energy. Answer questions correctly to gain energy!`);
      setCombatState(newCombatState);
      return;
    }

    // Consume energy for ability
    newCombatState.playerCharacter.currentEnergy -= ability.energyCost;
    newCombatState.combatLog.push(`Used ${abilityName} (-${ability.energyCost} energy)`);

    // Apply special ability effects - enhanced Pokemon-like mechanics
    if (ability.special === 'crit_chance' && Math.random() < 0.5) {
      damage *= 2;
      newCombatState.combatLog.push(`Critical hit! ${damage} damage!`);
    }

    if (ability.special === 'energy_drain') {
      const drainAmount = 20;
      newCombatState.currentEnemy.currentEnergy = Math.max(0, (newCombatState.currentEnemy.currentEnergy || 0) - drainAmount);
      newCombatState.combatLog.push(`Drained ${drainAmount} energy from enemy!`);
    }

    if (ability.special === 'heal') {
      const healAmount = ability.damage; // Reuse damage value for heal amount
      newCombatState.playerCharacter.currentHp = Math.min(
        newCombatState.playerCharacter.currentHp + healAmount,
        selectedCharacter.baseStats.hp
      );
      newCombatState.combatLog.push(`Healed ${healAmount} HP!`);
      
      // Trigger visual heal animation for player
      triggerHealAnimation(healAmount, 'player');
    } else {
      // Regular damage abilities
      newCombatState.currentEnemy.currentHp -= damage;
      newCombatState.combatLog.push(`${abilityName} deals ${damage} damage!`);
      
      // Trigger visual damage animation for enemy
      triggerDamageAnimation(damage, 'enemy');
    }

    if (ability.special === 'barrier') {
      newCombatState.playerCharacter.statusEffects.push({
        type: 'damage_reduction',
        value: 30, // 30% damage reduction
        duration: 2
      });
      newCombatState.combatLog.push(`Barrier active! 30% damage reduction for 2 turns.`);
    }

    if (ability.special === 'stun') {
      newCombatState.currentEnemy.statusEffects.push({
        type: 'stun',
        value: 1,
        duration: 1
      });
      newCombatState.combatLog.push(`Enemy is stunned for 1 turn!`);
    }

    // Apply quiz energy bonus AFTER ability execution
    newCombatState.playerCharacter.currentEnergy = Math.min(
      newCombatState.playerCharacter.currentEnergy + energyBonus,
      selectedCharacter.baseStats.energy
    );
    newCombatState.combatLog.push(`Correct! Gained ${energyBonus} energy!`);

    // Check for enemy defeat
    if (newCombatState.currentEnemy.currentHp <= 0) {
      newCombatState.combatLog.push(`You defeated the ${newCombatState.currentEnemy.name}!`);
      
      // Level progression logic
      newCombatState.defeatedEnemies += 1;
      
      if (newCombatState.defeatedEnemies >= 3) {
        // Victory condition
        setDungeonMode('victory');
        return;
      } else {
        // Spawn next enemy
        const randomGrunt = DUNGEON_ENEMIES.grunts[Math.floor(Math.random() * DUNGEON_ENEMIES.grunts.length)];
        newCombatState.currentEnemy = {
          ...randomGrunt,
          currentHp: randomGrunt.hp,
          statusEffects: []
        };
        newCombatState.combatLog.push(`A new ${randomGrunt.name} appears!`);
      }
    }

    // Switch to enemy turn
    newCombatState.playerTurn = false;
    newCombatState.turnNumber += 1;
    setCombatState(newCombatState);

    // Execute enemy turn after delay
    setTimeout(() => executeEnemyTurn(newCombatState), 1500);
  };

  const executePlayerTurn = (abilityName: string) => {
    if (!combatState || !combatState.playerTurn) return;

    const ability = selectedCharacter.abilities.find((a: any) => a.name === abilityName);
    if (!ability) return;

    let damage = ability.damage;
    let newCombatState = { ...combatState };

    // Energy is now only gained through correct quiz answers - no turn-based regeneration!

    // Energy validation - energy must be earned through correct quiz answers
    if (newCombatState.playerCharacter.currentEnergy < ability.energyCost) {
      newCombatState.combatLog.push(`Not enough energy! Need ${ability.energyCost} energy. Answer questions correctly to gain energy!`);
      setCombatState(newCombatState);
      return;
    }

    // Consume energy - energy must be earned back through quiz answers
    newCombatState.playerCharacter.currentEnergy -= ability.energyCost;
    newCombatState.combatLog.push(`Used ${abilityName} (-${ability.energyCost} energy)`);

    // Apply special ability effects - enhanced Pokemon-like mechanics
    if (ability.special === 'crit_chance' && Math.random() < 0.5) {
      damage *= 2;
      newCombatState.combatLog.push(`Critical hit! ${damage} damage!`);
    } else if (ability.special === 'heal_self') {
      const healAmount = 30;
      newCombatState.playerCharacter.currentHp = Math.min(
        newCombatState.playerCharacter.currentHp + healAmount,
        selectedCharacter.baseStats.hp
      );
      newCombatState.combatLog.push(`You heal for ${healAmount} HP!`);
    } else if (ability.special === 'steals_energy') {
      const energyStolen = 20;
      newCombatState.playerCharacter.currentEnergy = Math.min(
        newCombatState.playerCharacter.currentEnergy + energyStolen,
        selectedCharacter.baseStats.energy
      );
      newCombatState.combatLog.push(`Drained ${energyStolen} energy from enemy!`);
    } else if (ability.special === 'defense_boost') {
      newCombatState.playerCharacter.statusEffects.push({
        type: 'defense_boost',
        duration: 2,
        value: 50
      });
      newCombatState.combatLog.push(`Defense increased for 2 turns!`);
    } else if (ability.special === 'poison') {
      newCombatState.currentEnemy.statusEffects.push({
        type: 'poison',
        duration: 3,
        value: 10
      });
      newCombatState.combatLog.push(`Enemy is poisoned for 3 turns!`);
    } else if (ability.special === 'dodge_next') {
      newCombatState.playerCharacter.statusEffects.push({
        type: 'dodge_next',
        duration: 1,
        value: 100
      });
      newCombatState.combatLog.push(`Next attack will be dodged!`);
    } else if (ability.special === 'self_damage') {
      const selfDamage = 15;
      newCombatState.playerCharacter.currentHp -= selfDamage;
      newCombatState.combatLog.push(`Powerful attack hurts you for ${selfDamage} damage!`);
    } else if (ability.special === 'damage_reduction') {
      newCombatState.playerCharacter.statusEffects.push({
        type: 'damage_reduction',
        duration: 3,
        value: 30
      });
      newCombatState.combatLog.push(`Damage reduced by 30% for 3 turns!`);
    } else if (ability.special === 'stun') {
      if (Math.random() < 0.3) {
        newCombatState.currentEnemy.statusEffects.push({
          type: 'stun',
          duration: 1,
          value: 100
        });
        newCombatState.combatLog.push(`Enemy is stunned and will miss next turn!`);
      }
    }

    // Deal damage to enemy
    if (damage > 0) {
      newCombatState.currentEnemy.currentHp -= damage;
      newCombatState.combatLog.push(`${abilityName} deals ${damage} damage!`);
    }

    // Check if enemy is defeated
    if (newCombatState.currentEnemy.currentHp <= 0) {
      newCombatState.defeatedEnemies += 1;
      newCombatState.combatLog.push(`${newCombatState.currentEnemy.name} defeated!`);
      
      // Check if ready for boss fight
      if (newCombatState.defeatedEnemies >= 3 && !newCombatState.isBossFight) {
        const randomBoss = DUNGEON_ENEMIES.bosses[Math.floor(Math.random() * DUNGEON_ENEMIES.bosses.length)];
        newCombatState.currentEnemy = {
          ...randomBoss,
          currentHp: randomBoss.hp,
          statusEffects: []
        };
        newCombatState.isBossFight = true;
        newCombatState.combatLog.push(`Boss appears: ${randomBoss.name}!`);
      } else if (newCombatState.isBossFight) {
        // Victory!
        setDungeonMode('victory');
        setCombatState(newCombatState);
        return;
      } else {
        // Next grunt
        const randomGrunt = DUNGEON_ENEMIES.grunts[Math.floor(Math.random() * DUNGEON_ENEMIES.grunts.length)];
        newCombatState.currentEnemy = {
          ...randomGrunt,
          currentHp: randomGrunt.hp,
          statusEffects: []
        };
        newCombatState.combatLog.push(`Next enemy: ${randomGrunt.name}!`);
      }
    }

    // Switch to enemy turn
    newCombatState.playerTurn = false;
    newCombatState.turnNumber += 1;
    setCombatState(newCombatState);

    // Execute enemy turn after delay
    setTimeout(() => executeEnemyTurn(newCombatState), 1500);
  };

  // Process status effects and energy regeneration - core Pokemon mechanics
  const processStatusEffects = (combatState: CombatState) => {
    let newState = { ...combatState };
    
    // Process player status effects
    newState.playerCharacter.statusEffects = newState.playerCharacter.statusEffects.filter((effect: any) => {
      if (effect.type === 'poison') {
        newState.playerCharacter.currentHp -= effect.value;
        newState.combatLog.push(`You take ${effect.value} poison damage!`);
      }
      effect.duration -= 1;
      return effect.duration > 0;
    });

    // Process enemy status effects
    newState.currentEnemy.statusEffects = newState.currentEnemy.statusEffects.filter((effect: any) => {
      if (effect.type === 'poison') {
        newState.currentEnemy.currentHp -= effect.value;
        newState.combatLog.push(`${newState.currentEnemy.name} takes ${effect.value} poison damage!`);
      }
      effect.duration -= 1;
      return effect.duration > 0;
    });

    // Energy is now only gained through correct quiz answers - no automatic regeneration!

    return newState;
  };

  const executeEnemyTurn = (currentState: CombatState) => {
    if (!currentState.currentEnemy || currentState.currentEnemy.currentHp <= 0) return;

    let newCombatState = processStatusEffects(currentState);

    // Check for stun effect (enemy misses turn)
    const isStunned = newCombatState.currentEnemy.statusEffects.some((effect: any) => effect.type === 'stun');
    if (isStunned) {
      newCombatState.combatLog.push(`${newCombatState.currentEnemy.name} is stunned and misses their turn!`);
      newCombatState.playerTurn = true;
      setCombatState(newCombatState);
      return;
    }

    const enemyAbilities = newCombatState.currentEnemy.abilities || ['Basic Attack'];
    const randomAbility = enemyAbilities[Math.floor(Math.random() * enemyAbilities.length)];
    
    let damage = Math.floor(Math.random() * 15) + 10; // Random damage 10-25

    // Check for player dodge effect
    const hasDodge = newCombatState.playerCharacter.statusEffects.some((effect: any) => effect.type === 'dodge_next');
    if (hasDodge) {
      newCombatState.combatLog.push(`You dodge the attack completely!`);
      // Remove dodge effect after use
      newCombatState.playerCharacter.statusEffects = newCombatState.playerCharacter.statusEffects.filter(
        (effect: any) => effect.type !== 'dodge_next'
      );
    } else {
      // Apply damage reduction if player has it
      const damageReduction = newCombatState.playerCharacter.statusEffects.find((effect: any) => effect.type === 'damage_reduction');
      if (damageReduction) {
        damage = Math.floor(damage * (1 - damageReduction.value / 100));
        newCombatState.combatLog.push(`Damage reduced! ${damage} damage taken.`);
      }

      newCombatState.playerCharacter.currentHp -= damage;
      newCombatState.combatLog.push(`${newCombatState.currentEnemy.name} uses ${randomAbility} for ${damage} damage!`);
      
      // Trigger visual damage animation for player
      triggerDamageAnimation(damage, 'player');
    }

    // Check if player is defeated
    if (newCombatState.playerCharacter.currentHp <= 0) {
      newCombatState.combatLog.push('You have been defeated!');
      setDungeonMode('character-select');
      setCombatState(null);
      return;
    }

    // Switch back to player turn
    newCombatState.playerTurn = true;
    setCombatState(newCombatState);
  };

  // Fetch categories for game creation
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000, // Categories don't change often, cache for 5 minutes
  });

  // Fetch quiz topics for solo dungeon
  const { data: quizTopics = [] } = useQuery({
    queryKey: ['/api/quiz/topics'],
    staleTime: 5 * 60 * 1000, // Quiz topics don't change often, cache for 5 minutes
  });

  // Fetch quiz questions for the selected category
  const { data: quizQuestions = [] } = useQuery({
    queryKey: [`/api/quiz/topics/${selectedCategory?.id}/questions`],
    enabled: !!selectedCategory?.id,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Fetch Burblemon species for battle system
  const { data: burblemonSpecies = [] } = useQuery({
    queryKey: ['/api/burblemons/species'],
    staleTime: 10 * 60 * 1000, // Species data is relatively static, cache for 10 minutes
  });

  // Transform Burblemon species to battle system format
  const transformBurblemonToBattleCharacter = (species: any) => {
    // Define type-specific abilities and relationships
    const typeAbilities: Record<string, any[]> = {
      'Electric': [
        { name: 'Thunder Bolt', damage: 25, energyCost: 30, description: 'Powerful electric attack' },
        { name: 'Static Shield', damage: 0, energyCost: 25, special: 'defense_boost', description: 'Increases defense with electric barrier' },
        { name: 'Energy Drain', damage: 15, energyCost: 20, special: 'steals_energy', description: 'Absorbs enemy energy' },
        { name: 'Quick Strike', damage: 20, energyCost: 25, description: 'Fast electric attack' }
      ],
      'Fire': [
        { name: 'Flame Burst', damage: 30, energyCost: 35, special: 'crit_chance', description: '50% chance for double damage' },
        { name: 'Heat Wave', damage: 20, energyCost: 25, description: 'Spreading fire attack' },
        { name: 'Ignite', damage: 15, energyCost: 30, special: 'poison', description: 'Burns enemy over time' },
        { name: 'Blazing Rush', damage: 25, energyCost: 30, description: 'Fierce charging attack' }
      ],
      'Water': [
        { name: 'Aqua Pulse', damage: 25, energyCost: 30, description: 'Powerful water attack' },
        { name: 'Healing Stream', damage: 30, energyCost: 40, special: 'heal_self', description: 'Restores HP with water' },
        { name: 'Bubble Shield', damage: 0, energyCost: 25, special: 'defense_boost', description: 'Creates protective bubble' },
        { name: 'Tidal Force', damage: 28, energyCost: 35, description: 'Overwhelming water pressure' }
      ],
      'Grass': [
        { name: 'Leaf Storm', damage: 25, energyCost: 30, description: 'Swirling leaves attack' },
        { name: 'Root Heal', damage: 25, energyCost: 40, special: 'heal_self', description: 'Absorbs nutrients to heal' },
        { name: 'Vine Whip', damage: 20, energyCost: 25, description: 'Quick vine attack' },
        { name: 'Nature\'s Wrath', damage: 35, energyCost: 45, description: 'Powerful nature attack' }
      ]
    };

    const typeRelations: Record<string, { strengths: string[], weaknesses: string[] }> = {
      'Electric': { strengths: ['Water'], weaknesses: ['Grass'] },
      'Fire': { strengths: ['Grass'], weaknesses: ['Water'] },
      'Water': { strengths: ['Fire'], weaknesses: ['Electric'] },
      'Grass': { strengths: ['Electric', 'Water'], weaknesses: ['Fire'] }
    };

    const elementType = species.element_type || species.type || 'Electric';
    const abilities = typeAbilities[elementType] || typeAbilities['Electric'];
    const relations = typeRelations[elementType] || typeRelations['Electric'];

    return {
      id: `burblemon_${species.id}`,
      name: species.name,
      type: elementType,
      emoji: species.sprite_url || species.iconEmoji || '🔵',
      description: species.description || `A ${elementType.toLowerCase()} type Burblemon`,
      baseStats: {
        hp: species.base_hp || species.baseHp || 50,
        attack: species.base_attack || species.baseAttack || 50,
        defense: species.base_defense || species.baseDefense || 50,
        speed: species.base_speed || species.baseSpeed || 50,
        energy: 80 + (species.base_speed || species.baseSpeed || 50) // Energy based on speed
      },
      abilities: abilities,
      strengths: relations.strengths,
      weaknesses: relations.weaknesses
    };
  };

  // Create dynamic CHARACTER_OPTIONS from Burblemon species
  const CHARACTER_OPTIONS_DYNAMIC = Array.isArray(burblemonSpecies) && burblemonSpecies.length > 0 
    ? burblemonSpecies.map(transformBurblemonToBattleCharacter)
    : CHARACTER_OPTIONS; // Fallback to original hardcoded options

  // Fetch current session data with participants (including character types)
  const { data: sessionData } = useQuery({
    queryKey: [`/api/multiplayer/session/${currentSession?.id}`],
    enabled: !!currentSession?.id,
    refetchInterval: gameMode === 'playing' ? 3000 : false, // Only refresh during active games, less frequently
    staleTime: 2000, // Data stays fresh for 2 seconds
  });

  // Create game session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/multiplayer/create-session', {
        hostUserId: user?.id || 1,
        ...data
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Session creation response:', data);
      if (data.session) {
        setCurrentSession(data.session);
        setGameMode('character-select');
        connectWebSocket(data.session.id);
        toast({
          title: "Game Created!",
          description: `Share code: ${data.session.sessionCode}`,
        });
        console.log('Game mode set to character-select, session:', data.session);
      } else {
        console.error('No session in response:', data);
        setGameMode('menu');
        toast({
          title: "Error",
          description: "Session creation failed - no session data received",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to create game:', error);
      setGameMode('menu'); // Return to menu on error
      toast({
        title: "Failed to Create Game",
        description: error.message || "Unable to create game session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join game session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/multiplayer/join-session', {
        sessionCode: code,
        userId: user?.id || 1
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setGameMode('character-select');
      connectWebSocket(data.session.id);
      toast({
        title: "Joined Game!",
        description: `Welcome to the battle!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Game not found or already started",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection
  const connectWebSocket = (sessionId: number) => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current?.send(JSON.stringify({
          type: 'join',
          userId: user?.id || 1,
          sessionId
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to game server",
        variant: "destructive",
      });
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'user-joined':
        queryClient.invalidateQueries({ queryKey: [`/api/multiplayer/session/${currentSession?.id}`] });
        break;
        
      case 'player-ready':
        if (currentSession) {
          setCurrentSession(message.session);
        }
        break;
        
      case 'game-started':
        setCurrentQuestion(message.currentQuestion);
        setQuestionIndex(message.questionIndex);
        setTimeLeft(message.timePerQuestion);
        setGameStartTime(Date.now());
        setGameMode('playing');
        
        // Show welcome hint for first question
        if (message.questionIndex === 0) {
          setTimeout(() => {
            showContextualGameHint('general', 
              `Welcome to Dungeon Arena! Fight through grunts to reach the boss. Answer correctly to power your abilities. Wrong answers cost HP but you can still progress!`
            );
          }, 2000);
        }
        break;
        
      case 'answer-submitted':
        // Check if this was our answer and if it was correct
        if (message.userId === (user?.id || 1)) {
          setWasAnswerCorrect(message.isCorrect);
          
          // Show notification for answer result
          toast({
            title: message.isCorrect ? "🎉 Correct Answer!" : "❌ Wrong Answer", 
            description: message.isCorrect 
              ? "Great job! You gained energy and can choose your battle action." 
              : "You lost HP! Keep trying - you can still win this battle.",
            variant: message.isCorrect ? "default" : "destructive",
          });
          
          if (message.isCorrect) {
            // Reset wrong answer count on correct answer
            setWrongAnswerCount(0);
            // Show action selection for correct answers
            console.log('🎉 Correct answer! Transitioning to action-select mode');
            setGameMode('action-select');
            
            // Show energy hint for correct answers
            const currentPlayer = currentSession?.participants?.find(p => p.userId === (user?.id || 1));
            const currentPlayerCharacter = CHARACTER_OPTIONS.find(s => s.id === currentPlayer?.characterType) || CHARACTER_OPTIONS[4];
            if (currentPlayerCharacter.baseStats.energy > 0) {
              showContextualGameHint('energy', 
                `Great! Your ${currentPlayerCharacter.name} character gained energy! Use it wisely for powerful abilities.`
              );
            }
          } else {
            // Track wrong answers for hints
            const newWrongCount = wrongAnswerCount + 1;
            setWrongAnswerCount(newWrongCount);
            setLastUserAnswer(userAnswer);
            
            const newAttempts = attemptsUsed + 1;
            setAttemptsUsed(newAttempts);
            
            if (newAttempts >= MAX_ATTEMPTS) {
              // Show wrong answer modal when attempts exhausted
              setIsWrongModalOpen(true);
              toast({
                title: "Maximum attempts reached",
                description: message.correctAnswer ? `The correct answer was "${message.correctAnswer}". Click Next Question to continue!` : "No more attempts. Try the next question!",
                variant: "destructive",
              });
            } else {
              // Show normal wrong answer feedback
              const attemptsLeft = MAX_ATTEMPTS - newAttempts;
              toast({
                title: "Incorrect Answer",
                description: `You lost HP! ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`,
                variant: "destructive",
              });
            }
            
            // Show contextual hint after multiple wrong answers
            if (newWrongCount >= 2 && !showContextualHint) {
              showContextualGameHint('wrong', 
                `Having trouble? Remember: think about word meanings, patterns, or try breaking down complex riddles into parts. Use battle actions strategically!`
              );
            }
          }
        }
        
        // Show individual battle effect immediately if there is one
        if (message.battleEffects) {
          setCurrentMoves([message.battleEffects]);
          setShowMoveAnimations(true);
          
          // Hide animation after 1.5 seconds
          setTimeout(() => {
            setShowMoveAnimations(false);
            setCurrentMoves([]);
          }, 1500);
        }
        
        // Refresh session data to get updated HP values
        if (currentSession) {
          queryClient.invalidateQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
        }
        break;
        
      case 'battle-moves':
        // Show move animations
        setCurrentMoves(message.moves);
        setShowMoveAnimations(true);
        
        // Hide animations after 2 seconds
        setTimeout(() => {
          setShowMoveAnimations(false);
          setCurrentMoves([]);
        }, 2000);
        break;
        
      case 'next-question':
        setCurrentQuestion(message.currentQuestion);
        setQuestionIndex(message.questionIndex);
        setTimeLeft(currentSession?.timePerQuestion || 30);
        setGameStartTime(Date.now());
        setUserAnswer('');
        setGameMode('playing'); // Reset to playing mode for next question
        break;
        
      case 'battle-action-confirmed':
        break;
        
      case 'battle-result':
        setBattleResult(message);
        setGameMode('battle-result');
        
        // Show result briefly then return to waiting for next question
        setTimeout(() => {
          setGameMode('playing');
          setBattleResult(null);
          setPendingBattleAction(null);
        }, 4000);
        break;
        
      case 'participant-action':
        // Update session data to reflect battle actions
        if (currentSession) {
          queryClient.invalidateQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
        }
        break;
        
      case 'game-finished':
        setLeaderboard(message.leaderboard);
        setGameMode('finished');
        break;
        
      case 'character-selected':
        // Update session data to reflect character selection
        if (currentSession) {
          // Immediately fetch fresh session data
          queryClient.invalidateQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
          }, 100);
        }
        break;
    }
  };

  // Contextual hint triggers
  const showContextualGameHint = (type: 'time' | 'wrong' | 'energy' | 'general', message: string) => {
    setContextualHintType(type);
    setHintMessage(message);
    setShowContextualHint(true);
  };

  const dismissContextualHint = () => {
    setShowContextualHint(false);
  };

  // Wrong answer modal handlers
  const handleShowAnswer = () => {
    if (currentQuestion) {
      toast({
        title: "Answer Revealed",
        description: `The correct answer was: ${currentQuestion.answer}`,
        variant: "default",
      });
    }
  };

  const handleTryAgain = () => {
    setIsWrongModalOpen(false);
  };

  const handleNextQuestion = () => {
    setIsWrongModalOpen(false);
    setAttemptsUsed(0); // Reset attempts for next question
    setUserAnswer('');
    
    // Send next question request to server
    if (wsRef.current && currentSession) {
      wsRef.current.send(JSON.stringify({
        type: 'next-question',
        userId: user?.id || 1,
        sessionId: currentSession.id
      }));
    }
  };

  // Timer effect with contextual hints and auto bot attacks
  useEffect(() => {
    if (gameMode === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      // Show time hint when running low on time
      if (timeLeft === 10 && !showContextualHint) {
        showContextualGameHint('time', 
          `Only ${timeLeft} seconds left! Think quickly or use a strategic guess. Wrong answers cost HP but you can still progress.`
        );
      }
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameMode === 'playing') {
      // Auto-submit when time runs out and show timeout penalty
      toast({
        title: "Time's Up!",
        description: "You lost HP for running out of time!",
        variant: "destructive",
      });
      submitAnswer();
    }
  }, [timeLeft, gameMode, showContextualHint]);

  // Auto bot attack timer based on difficulty
  useEffect(() => {
    if (gameMode === 'playing' && currentSession && currentQuestion) {
      const hasBotParticipant = currentSession.participants?.some(p => p.user.username.startsWith('Bot_'));
      
      if (hasBotParticipant) {
        const difficulty = currentSession.difficulty || 'easy';
        let botAttackInterval: number;
        
        // Set bot attack timing based on difficulty
        switch (difficulty) {
          case 'easy':
            botAttackInterval = 10000; // 10 seconds
            break;
          case 'medium':
            botAttackInterval = 5000; // 5 seconds
            break;
          case 'hard':
            botAttackInterval = 3000; // 3 seconds
            break;
          default:
            botAttackInterval = 10000; // Default to easy
        }
        
        const botTimer = setInterval(() => {
          // Check if bot hasn't answered this question yet
          const bot = currentSession.participants?.find(p => p.user.username.startsWith('Bot_'));
          if (bot && wsRef.current) {
            // Bot auto-submits answer
            console.log(`Bot auto-attacking after ${botAttackInterval/1000}s on ${difficulty} difficulty`);
            // This will be handled by the server's bot logic
          }
        }, botAttackInterval);
        
        return () => clearInterval(botTimer);
      }
    }
  }, [gameMode, currentSession, currentQuestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const markReady = () => {
    if (wsRef.current && currentSession) {
      wsRef.current.send(JSON.stringify({
        type: 'ready',
        userId: user?.id || 1,
        sessionId: currentSession.id
      }));
    }
  };

  const submitAnswer = () => {
    if (wsRef.current && currentSession && gameStartTime) {
      const timeToAnswer = Math.floor((Date.now() - gameStartTime) / 1000);
      
      wsRef.current.send(JSON.stringify({
        type: 'submit-answer',
        userId: user?.id || 1,
        sessionId: currentSession.id,
        answer: userAnswer,
        timeToAnswerSeconds: timeToAnswer,
        questionIndex
      }));
      
      setUserAnswer('');
    }
  };

  const selectBattleAction = (action: string) => {
    if (wsRef.current && currentSession) {
      setPendingBattleAction(action);
      
      wsRef.current.send(JSON.stringify({
        type: 'battle-action',
        userId: user?.id || 1,
        sessionId: currentSession.id,
        action,
        questionIndex
      }));
      
      setGameMode('battle-result');
    }
  };

  const selectSprite = (characterId: string) => {
    setSelectedSprite(characterId);
    setHasSelectedSprite(true); // Track local selection state
    if (wsRef.current && currentSession) {
      wsRef.current.send(JSON.stringify({
        type: 'select-character',
        userId: user?.id || 1,
        sessionId: currentSession.id,
        characterType: characterId
      }));
      
      // Mark player as ready after character selection
      wsRef.current.send(JSON.stringify({
        type: 'ready',
        userId: user?.id || 1,
        sessionId: currentSession.id
      }));
      
      // Force immediate refetch of session data to get updated character info
      setTimeout(async () => {
        queryClient.invalidateQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
        queryClient.refetchQueries({ queryKey: [`/api/multiplayer/session/${currentSession.id}`] });
        
        // Also fetch fresh session data directly from API
        try {
          const response = await fetch(`/api/multiplayer/session/${currentSession.id}`);
          if (response.ok) {
            const freshData = await response.json();
            if (freshData.success && freshData.session) {
              setCurrentSession(freshData.session);
              console.log('Updated session with fresh API data:', freshData.session);
            }
          }
        } catch (error) {
          console.error('Failed to fetch fresh session data:', error);
        }
      }, 800);
      
      // For bot battles, wait for game to start automatically
      // For regular multiplayer, go to lobby
      const hasBotParticipant = currentSession.participants?.some(p => p.user.username.startsWith('Bot_'));
      if (hasBotParticipant) {
        // Bot battle - show waiting for game start
        setGameMode('waiting-for-start');
      } else {
        // Regular multiplayer - go to lobby
        setGameMode('lobby');
      }
    }
  };


  const handleJoinGame = () => {
    if (sessionCode.trim()) {
      joinSessionMutation.mutate(sessionCode.toUpperCase());
    }
  };

  const handleCreateGame = (formData: any) => {
    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a game",
          variant: "destructive",
        });
        return;
      }

      // Store withBot flag for after session creation
      const shouldAddBot = formData.withBot === true;

      createSessionMutation.mutate({
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        difficulty: formData.difficulty || null,
        maxPlayers: Number(formData.maxPlayers) || 2,
        timePerQuestion: Number(formData.timePerQuestion) || 30,
        withBot: shouldAddBot
      });
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    }
  };

  // Health Bar Component
  const HealthBar = ({ participant, isCurrentUser }: { participant: GameParticipant; isCurrentUser: boolean }) => {
    const hpPercentage = (participant.hp / (participant.maxHp || 50)) * 100;
    const hpColor = hpPercentage > 60 ? 'bg-green-500' : hpPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500';
    const characterInfo = CHARACTER_OPTIONS_DYNAMIC.find(s => s.id === participant.characterType) || CHARACTER_OPTIONS_DYNAMIC[0];
    
    return (
      <div className={`p-4 rounded-lg border-2 ${isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-lg">
              {characterInfo.emoji}
            </div>
            <div>
              <span className="font-medium">{participant.user.username}</span>
              <div className="text-xs text-gray-500">{characterInfo.name}</div>
            </div>
            {isCurrentUser && <Badge variant="outline">You</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            {participant.energy > 0 && (
              <div className="flex items-center text-purple-600">
                <Zap className="w-4 h-4 mr-1" />
                <span className="text-xs">{participant.energy}</span>
              </div>
            )}
            {participant.hasShield && (
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-xs">Shield</span>
              </div>
            )}
            {participant.chargePower > 0 && (
              <div className="flex items-center text-orange-600">
                <Battery className="w-4 h-4 mr-1" />
                <span className="text-xs">+{participant.chargePower}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-red-500" />
          <div className="flex-1">
            <Progress value={hpPercentage} className="h-3" />
          </div>
          <span className="text-sm font-bold">{participant.hp}/{participant.maxHp || 50}</span>
        </div>
        {participant.lastAction && (
          <div className="mt-2 text-xs text-gray-600">
            Last action: <span className="capitalize">{participant.lastAction}</span>
          </div>
        )}
      </div>
    );
  };

  // Menu Screen
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Multiplayer Dungeon Arena
            </h1>
            <p className="text-xl text-muted-foreground">
              Challenge players worldwide in real-time brain battles!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
              isGuestMode ? 'opacity-50 hover:border-gray-300' : 'hover:border-primary'
            }`} 
                  onClick={() => isGuestMode ? alert('Please log in to create multiplayer games') : setGameMode('create')}>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Create Game</CardTitle>
                <CardDescription>
                  {isGuestMode ? '🔒 Login required for multiplayer' : 'Host a new session and wait for players to join'}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-500" 
                  onClick={() => {
                    setDungeonMode('character-select');
                    setGameMode('difficulty-select'); // Use any non-menu mode to hide menu
                  }}>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sword className="w-8 h-8 text-purple-500" />
                </div>
                <CardTitle className="text-xl">Solo Dungeon</CardTitle>
                <CardDescription>
                  Fight grunts and bosses in Pokemon-style turn-based combat
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
              isGuestMode ? 'opacity-50 hover:border-gray-300' : 'hover:border-secondary'
            }`} 
                  onClick={() => isGuestMode ? alert('Please log in to join multiplayer games') : setGameMode('join')}>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">Join Game</CardTitle>
                <CardDescription>
                  {isGuestMode ? '🔒 Login required for multiplayer' : 'Enter a game code to join an existing battle'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Category Selection Screen for Solo Dungeon
  if (dungeonMode === 'category-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500/10 to-purple-500/10 p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => {
              setDungeonMode('category-select');
              setGameMode('menu');
            }}
            className="mb-6"
          >
            ← Back to Menu
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Choose Quiz Category
            </h1>
            <p className="text-xl text-muted-foreground">
              Select a category to earn energy through knowledge in battle!
            </p>
          </div>

          {/* Preset Categories */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Featured Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Math Category */}
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                  selectedCategory?.name === 'Math' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:border-blue-300'
                }`}
                onClick={() => setSelectedCategory({ id: 1, name: 'Math', description: 'Mathematical problems and equations', colorTheme: 'blue', iconEmoji: '🔢' })}
                data-testid="category-math"
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">🔢</div>
                  <CardTitle className="text-xl">Math</CardTitle>
                  <CardDescription>Solve mathematical problems to gain energy and defeat enemies</CardDescription>
                </CardHeader>
              </Card>

              {/* History Category */}
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                  selectedCategory?.name === 'History' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : 'hover:border-amber-300'
                }`}
                onClick={() => setSelectedCategory({ id: 2, name: 'History', description: 'Historical events and figures', colorTheme: 'amber', iconEmoji: '🏛️' })}
                data-testid="category-history"
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">🏛️</div>
                  <CardTitle className="text-xl">History</CardTitle>
                  <CardDescription>Answer historical questions to power your abilities</CardDescription>
                </CardHeader>
              </Card>

              {/* Animal Facts Category */}
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                  selectedCategory?.name === 'Animal Facts' ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'hover:border-green-300'
                }`}
                onClick={() => setSelectedCategory({ id: 3, name: 'Animal Facts', description: 'Fascinating facts about the animal kingdom', colorTheme: 'green', iconEmoji: '🦁' })}
                data-testid="category-animals"
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">🦁</div>
                  <CardTitle className="text-xl">Animal Facts</CardTitle>
                  <CardDescription>Use your knowledge of animals to gain combat energy</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Available Quiz Topics from Database */}
          {Array.isArray(quizTopics) && quizTopics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Available Topics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(quizTopics) && quizTopics.map((topic: any) => (
                  <Card 
                    key={topic.id}
                    className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                      selectedCategory?.id === topic.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' : 'hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedCategory(topic)}
                    data-testid={`category-${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardHeader className="text-center">
                      <div className="text-4xl mb-2">{topic.iconEmoji || '🧠'}</div>
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <CardDescription className="text-sm">{topic.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          {selectedCategory && (
            <div className="text-center">
              <Button 
                onClick={() => setDungeonMode('character-select')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white px-8 py-3"
                data-testid="button-continue-to-character-select"
              >
                Continue to Character Selection →
              </Button>
            </div>
          )}

          {/* Selected Category Info */}
          {selectedCategory && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-bold">{selectedCategory.name}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dungeon Character Selection Screen
  if (dungeonMode === 'character-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setDungeonMode('category-select')}
            className="mb-6"
            data-testid="button-back-to-category"
          >
            ← Back to Categories
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Choose Your Fighter
            </h1>
            <p className="text-xl text-muted-foreground">
              Select a character and fight through the dungeon!
            </p>
            {selectedCategory && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-purple-100 dark:from-orange-900/20 dark:to-purple-900/20 px-6 py-3 rounded-full">
                <span className="text-2xl">{selectedCategory.iconEmoji || '🧠'}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Quiz Category: {selectedCategory.name}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHARACTER_OPTIONS_DYNAMIC.map((character) => (
              <Card 
                key={character.id}
                className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                  selectedCharacter?.id === character.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' : 'hover:border-purple-300'
                }`}
                onClick={() => setSelectedCharacter(character)}
              >
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">{character.emoji}</div>
                  <CardTitle className="text-xl">{character.name}</CardTitle>
                  <CardDescription>{character.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>HP:</span>
                      <span className="font-bold text-red-500">{character.baseStats.hp}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Energy:</span>
                      <span className="font-bold text-blue-500">{character.baseStats.energy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span className="font-bold text-purple-500 capitalize">{character.type}</span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <h4 className="font-semibold text-sm mb-2">Abilities:</h4>
                      <div className="space-y-1">
                        {character.abilities.map((ability, index) => (
                          <div key={index} className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <div className="font-semibold">{ability.name}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {ability.damage ? `${ability.damage} damage` : 'Special ability'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCharacter && (
            <div className="text-center mt-8">
              <Button 
                onClick={() => initializeDungeonCombat(selectedCharacter)}
                className="px-8 py-3 text-lg bg-purple-600 hover:bg-purple-700"
              >
                Enter Dungeon
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get category-based arena background
  const getArenaBackground = () => {
    if (!selectedCategory) {
      return "min-h-screen bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6";
    }

    switch (selectedCategory.name) {
      case 'Math':
        return "min-h-screen bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 relative overflow-hidden";
      case 'History':
        return "min-h-screen bg-gradient-to-br from-amber-900/30 to-orange-900/30 p-6 relative overflow-hidden";
      case 'Animal Facts':
        return "min-h-screen bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 relative overflow-hidden";
      default:
        return "min-h-screen bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 relative overflow-hidden";
    }
  };

  const getArenaPatterns = () => {
    if (!selectedCategory) return null;

    switch (selectedCategory.name) {
      case 'Math':
        return (
          <div className="absolute inset-0 opacity-10">
            {/* Mathematical pattern overlay */}
            <div className="absolute top-10 left-10 text-6xl text-blue-300 select-none">∑</div>
            <div className="absolute top-20 right-20 text-4xl text-cyan-300 select-none">π</div>
            <div className="absolute bottom-20 left-20 text-5xl text-blue-300 select-none">∞</div>
            <div className="absolute bottom-10 right-10 text-3xl text-cyan-300 select-none">√</div>
            <div className="absolute top-1/2 left-1/4 text-4xl text-blue-300 select-none">∂</div>
            <div className="absolute top-1/3 right-1/3 text-5xl text-cyan-300 select-none">∫</div>
          </div>
        );
      case 'History':
        return (
          <div className="absolute inset-0 opacity-10">
            {/* Historical pattern overlay */}
            <div className="absolute top-10 left-10 text-6xl text-amber-300 select-none">🏛️</div>
            <div className="absolute top-20 right-20 text-4xl text-orange-300 select-none">⚔️</div>
            <div className="absolute bottom-20 left-20 text-5xl text-amber-300 select-none">👑</div>
            <div className="absolute bottom-10 right-10 text-3xl text-orange-300 select-none">🏺</div>
            <div className="absolute top-1/2 left-1/4 text-4xl text-amber-300 select-none">📜</div>
            <div className="absolute top-1/3 right-1/3 text-5xl text-orange-300 select-none">🗿</div>
          </div>
        );
      case 'Animal Facts':
        return (
          <div className="absolute inset-0 opacity-10">
            {/* Nature pattern overlay */}
            <div className="absolute top-10 left-10 text-6xl text-green-300 select-none">🦁</div>
            <div className="absolute top-20 right-20 text-4xl text-emerald-300 select-none">🐺</div>
            <div className="absolute bottom-20 left-20 text-5xl text-green-300 select-none">🦅</div>
            <div className="absolute bottom-10 right-10 text-3xl text-emerald-300 select-none">🐢</div>
            <div className="absolute top-1/2 left-1/4 text-4xl text-green-300 select-none">🦋</div>
            <div className="absolute top-1/3 right-1/3 text-5xl text-emerald-300 select-none">🌿</div>
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 opacity-10">
            {/* Default mystical pattern overlay */}
            <div className="absolute top-10 left-10 text-6xl text-purple-300 select-none">✨</div>
            <div className="absolute top-20 right-20 text-4xl text-pink-300 select-none">🌟</div>
            <div className="absolute bottom-20 left-20 text-5xl text-purple-300 select-none">🔮</div>
            <div className="absolute bottom-10 right-10 text-3xl text-pink-300 select-none">⭐</div>
            <div className="absolute top-1/2 left-1/4 text-4xl text-purple-300 select-none">🎭</div>
            <div className="absolute top-1/3 right-1/3 text-5xl text-pink-300 select-none">🎪</div>
          </div>
        );
    }
  };

  // Dungeon Combat Screen
  if (dungeonMode === 'combat' && combatState) {
    return (
      <div className={getArenaBackground()}>
        {getArenaPatterns()}
        <motion.div 
          className="relative z-10"
          animate={screenShake ? { x: [-3, 3, -3, 3, 0], y: [-2, 2, -2, 2, 0] } : {}}
          transition={{ duration: 0.5, times: [0, 0.25, 0.5, 0.75, 1] }}
        >
          {/* Floating Damage Numbers */}
          <AnimatePresence>
            {damageNumbers.map((damageNum) => (
              <motion.div
                key={damageNum.id}
                className={`absolute text-3xl font-bold pointer-events-none z-50 ${
                  damageNum.amount > 0 ? 'text-red-500 drop-shadow-lg' : 'text-green-400 drop-shadow-lg'
                }`}
                style={{
                  left: damageNum.type === 'player' ? '20%' : '80%',
                  top: '35%',
                }}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ 
                  opacity: 0, 
                  y: -60, 
                  scale: 1.3,
                  x: (Math.random() - 0.5) * 50 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
              >
                {damageNum.amount > 0 ? `-${damageNum.amount}` : `+${Math.abs(damageNum.amount)}`}
              </motion.div>
            ))}
          </AnimatePresence>
          
        <div className="max-w-6xl mx-auto">
          {/* Arena Category Header */}
          {selectedCategory && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-3 bg-black/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <span className="text-3xl">{selectedCategory.iconEmoji || '🧠'}</span>
                <div className="text-white">
                  <div className="text-sm font-medium opacity-80">Battle Arena</div>
                  <div className="text-lg font-bold">{selectedCategory.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Combat Header */}
          <div className="text-center mb-6">
            <div className="flex justify-between items-center mb-4">
              <Badge variant={combatState.isBossFight ? "destructive" : "secondary"} className="text-lg py-2 px-4">
                {combatState.isBossFight ? "🔥 BOSS FIGHT" : `Grunt ${combatState.defeatedEnemies + 1}/3`}
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                Turn {combatState.turnNumber}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold">
              {combatState.playerTurn ? "Your Turn" : `${combatState.currentEnemy.name}'s Turn`}
            </h2>
          </div>

          {/* Battle Scene */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Player Character */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedCharacter.name}</span>
                  <span className="text-2xl">{selectedCharacter.sprite}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>HP</span>
                      <span>{combatState.playerCharacter.currentHp}/{selectedCharacter.baseStats.hp}</span>
                    </div>
                    <motion.div
                      animate={healthFlash.player ? { 
                        backgroundColor: ['#ffffff', '#ff4444', '#ffffff'],
                        scale: [1, 1.02, 1]
                      } : {}}
                      transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                    >
                      <Progress 
                        value={(combatState.playerCharacter.currentHp / selectedCharacter.baseStats.hp) * 100} 
                        className={`h-3 transition-all duration-300 ${
                          (combatState.playerCharacter.currentHp / selectedCharacter.baseStats.hp) <= 0.25 
                            ? 'animate-pulse' 
                            : ''
                        }`}
                      />
                    </motion.div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Energy</span>
                      <span>{combatState.playerCharacter.currentEnergy}/{selectedCharacter.baseStats.energy}</span>
                    </div>
                    <Progress 
                      value={(combatState.playerCharacter.currentEnergy / selectedCharacter.baseStats.energy) * 100} 
                      className="h-3 bg-blue-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enemy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{combatState.currentEnemy.name}</span>
                  <span className="text-2xl">{combatState.currentEnemy.sprite}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>HP</span>
                      <span>{combatState.currentEnemy.currentHp}/{combatState.currentEnemy.hp}</span>
                    </div>
                    <motion.div
                      animate={healthFlash.enemy ? { 
                        backgroundColor: ['#ffffff', '#ff4444', '#ffffff'],
                        scale: [1, 1.02, 1]
                      } : {}}
                      transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                    >
                      <Progress 
                        value={(combatState.currentEnemy.currentHp / combatState.currentEnemy.hp) * 100} 
                        className={`h-3 transition-all duration-300 ${
                          (combatState.currentEnemy.currentHp / combatState.currentEnemy.hp) <= 0.25 
                            ? 'animate-pulse' 
                            : ''
                        }`}
                      />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Actions */}
          {combatState.playerTurn && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Choose Your Action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedCharacter.abilities.map((ability: any, index: number) => {
                    const hasEnoughEnergy = combatState.playerCharacter.currentEnergy >= ability.energyCost;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={`p-4 h-auto text-left flex flex-col items-start ${
                          !hasEnoughEnergy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
                        }`}
                        onClick={() => initiateAbilityWithQuiz(ability.name)}
                        disabled={!combatState.playerTurn || !hasEnoughEnergy}
                      >
                        <div className="font-semibold">{ability.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ability.damage ? `${ability.damage} damage` : ability.description}
                        </div>
                        <div className={`text-xs mt-2 font-bold flex items-center ${
                          hasEnoughEnergy ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          <Zap className="w-3 h-3 mr-1" />
                          {ability.energyCost} energy {hasEnoughEnergy ? '✓' : '✗'}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Combat Log */}
          <Card>
            <CardHeader>
              <CardTitle>Combat Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded max-h-32 overflow-y-auto">
                {combatState.combatLog.map((entry, index) => (
                  <div key={index} className="text-sm mb-1">
                    {entry}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Modal */}
          {showQuizModal && currentQuizQuestion && pendingAbility && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="quiz-modal">
              <Card className="w-full max-w-2xl mx-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedCategory?.iconEmoji || '🧠'}</span>
                    <span>Answer to Use {pendingAbility.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Answer correctly to execute your ability and gain energy!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-lg font-medium">{currentQuizQuestion.questionText}</p>
                  </div>
                  
                  {currentQuizQuestion.choices && (
                    <div className="space-y-2">
                      {JSON.parse(currentQuizQuestion.choices).map((choice: string, index: number) => (
                        <Button
                          key={index}
                          variant={quizAnswer === choice ? "default" : "outline"}
                          className="w-full text-left justify-start"
                          onClick={() => setQuizAnswer(choice)}
                          data-testid={`choice-${index}`}
                        >
                          {String.fromCharCode(65 + index)}. {choice}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {currentQuizQuestion.questionType === 'text_input' && (
                    <Input
                      placeholder="Type your answer..."
                      value={quizAnswer}
                      onChange={(e) => setQuizAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuizAnswer()}
                      data-testid="text-answer-input"
                    />
                  )}
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowQuizModal(false);
                        setCurrentQuizQuestion(null);
                        setPendingAbility(null);
                        setQuizAnswer('');
                      }}
                      data-testid="cancel-quiz"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleQuizAnswer}
                      disabled={!quizAnswer.trim() || isSubmittingAnswer}
                      data-testid="submit-answer"
                    >
                      {isSubmittingAnswer ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </motion.div>
      </div>
    );
  }

  // Victory Screen
  if (dungeonMode === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500/20 to-purple-500/20 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Victory!
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            You conquered the dungeon and defeated the boss!
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setDungeonMode('character-select');
                setCombatState(null);
                setSelectedCharacter(null);
              }}
              className="mr-4"
            >
              Play Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setDungeonMode('character-select');
                setCombatState(null);
                setSelectedCharacter(null);
                setGameMode('menu');
              }}
            >
              Return to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Create Game Screen
  if (gameMode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setGameMode('menu')}
            className="mb-6"
          >
            ← Back to Menu
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create Multiplayer Game</CardTitle>
              <CardDescription>Set up your battle arena</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateGame({
                  categoryId: formData.get('categoryId'),
                  difficulty: formData.get('difficulty'),
                  maxPlayers: formData.get('maxPlayers'),
                  timePerQuestion: formData.get('timePerQuestion')
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Any Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Category</SelectItem>
                      {(categories as any[]).map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select name="difficulty" defaultValue="mixed">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Players</label>
                  <Select name="maxPlayers" defaultValue="2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="6">6 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time per Question</label>
                  <Select name="timePerQuestion" defaultValue="45">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="45">45 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={createSessionMutation.isPending}>
                  {createSessionMutation.isPending ? 'Creating...' : 'Create Game'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Join Game Screen - Gimkit Style
  if (gameMode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/5 to-blue-500/5 p-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setGameMode('menu')}
            className="mb-8"
            size="lg"
          >
            ← Back to Menu
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-green-600">🎮 Join Game</h1>
            <p className="text-xl text-gray-600">Enter the game code to join the battle</p>
          </div>

          {/* Large Code Input - Gimkit Style */}
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-8 border-4 border-green-500">
            <div className="text-center">
              <label className="block text-lg text-gray-600 mb-6 font-semibold">Enter Game Code</label>
              <Input 
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="text-center text-6xl font-mono tracking-wider h-20 border-4 border-gray-300 rounded-xl bg-gray-50 mb-8"
                maxLength={6}
                autoFocus
              />
              
              <Button 
                onClick={handleJoinGame}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-2xl px-16 py-6 h-auto" 
                disabled={sessionCode.length !== 6 || joinSessionMutation.isPending}
              >
                {joinSessionMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                    Joining...
                  </div>
                ) : (
                  '🚀 Join Game'
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">How to Join</h3>
              <p className="text-blue-700">
                Ask your host for the 6-character game code and enter it above. 
                The code will automatically convert to uppercase letters.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Difficulty Selection Screen for Bot Battle
  if (gameMode === 'difficulty-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setGameMode('menu')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>

          {/* Bot Difficulty Level Display */}
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-purple-800 flex items-center justify-center">
                🤖 AI Bot Challenge Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">Level {user?.botDifficultyLevel || 1}</div>
                  <div className="text-sm text-gray-600">{user?.botWins || 0}W - {user?.botLosses || 0}L</div>
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${((user?.botDifficultyLevel || 1) - 1) / 9 * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-600">
                    +{Math.round(10 + ((user?.botDifficultyLevel || 1) - 1) * 11)}% Bot Power
                  </div>
                  <div className="text-xs text-gray-600">Current Difficulty</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-700">
                  Win 2 consecutive battles to increase difficulty • Lose 3 in a row to decrease
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Selection */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl mb-2">Choose Category</CardTitle>
                <CardDescription>
                  Select the type of questions you want to face
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(categories as any[]).map((category: any) => (
                  <Card key={category.id} 
                        className={`cursor-pointer hover:shadow-md transition-all border-2 ${
                          selectedCategory === category.id ? 'border-primary bg-primary/5' : 'hover:border-primary'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="text-lg">
                          {selectedCategory === category.id ? '✅' : '📚'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Difficulty Selection */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl mb-2">Choose Difficulty</CardTitle>
                <CardDescription>
                  Select the challenge level for your battle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <Card key={difficulty} 
                        className={`cursor-pointer hover:shadow-md transition-all border-2 ${
                          selectedDifficulty === difficulty ? 'border-primary bg-primary/5' : 'hover:border-primary'
                        }`}
                        onClick={() => setSelectedDifficulty(difficulty)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold capitalize">{difficulty}</h3>
                          <p className="text-xs text-muted-foreground">
                            {difficulty === 'easy' ? 'Perfect for beginners' :
                             difficulty === 'medium' ? 'Balanced challenge' :
                             'Ultimate challenge'}
                          </p>
                        </div>
                        <div className="text-lg">
                          {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Start Battle Button */}
          <div className="text-center mt-6">
            <Button 
              size="lg"
              disabled={!selectedCategory || !selectedDifficulty}
              onClick={() => {
                if (selectedCategory && selectedDifficulty) {
                  createSessionMutation.mutate({
                    categoryId: selectedCategory,
                    difficulty: selectedDifficulty,
                    timePerQuestion: 45,
                    withBot: true
                  });
                }
              }}
              className="px-8"
            >
              {!selectedCategory || !selectedDifficulty ? 
                'Select Category & Difficulty' : 
                `Start ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Battle`
              }
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Force character selection if players haven't selected characters yet (but respect local selection state)
  if (currentSession && currentSession.status === 'waiting' && currentSession.participants) {
    const currentUserParticipant = currentSession.participants.find(p => p.userId === (user?.id || 1));
    const hasSpriteInSession = currentUserParticipant?.characterType && currentUserParticipant.characterType !== 'balanced';
    
    // If user hasn't selected a character yet and hasn't just selected one locally, force character selection mode
    if (!hasSpriteInSession && !hasSelectedSprite && gameMode !== 'character-select') {
      console.log('Forcing character selection - user has not selected character yet');
      setGameMode('character-select');
    }
  }

  // Host Lobby Screen - Gimkit Style (for hosts waiting for players)
  if (currentSession && currentSession.status === 'waiting' && currentSession.hostUserId === (user?.id || 1) && !currentSession.participants?.some(p => p.user.username.startsWith('Bot_'))) {
    const playersJoined = currentSession.participants?.length || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-blue-600">🎮 Game Lobby</h1>
            <p className="text-lg text-gray-600">Share the code below for players to join</p>
          </div>

          {/* Game Code - Large and Prominent like Gimkit */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-4 border-blue-500">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-semibold">Join Code</div>
              <div className="text-6xl font-bold font-mono tracking-wider text-blue-600 mb-4">
                {currentSession.sessionCode}
              </div>
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                onClick={() => {
                  navigator.clipboard.writeText(currentSession.sessionCode);
                  toast({
                    title: "📋 Copied to Clipboard!",
                    description: "Share this code with your players",
                  });
                }}
              >
                📋 Copy Code
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Players ({playersJoined}/{currentSession.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(currentSession.participants || []).map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {participant.user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{participant.user.username}</div>
                          {participant.userId === currentSession.hostUserId && (
                            <Badge variant="secondary" className="text-xs">👑 Host</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">✓ Ready</div>
                    </div>
                  ))}
                  
                  {/* Show empty slots */}
                  {Array.from({ length: currentSession.maxPlayers - playersJoined }).map((_, index) => (
                    <div key={`empty-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-gray-500">Waiting for player...</div>
                      </div>
                      <div className="text-gray-400">⏳</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Category</span>
                  <span className="font-semibold">Logic Puzzles</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Difficulty</span>
                  <span className="font-semibold capitalize">{currentSession.difficulty}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Time per Question</span>
                  <span className="font-semibold">{currentSession.timePerQuestion}s</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Max Players</span>
                  <span className="font-semibold">{currentSession.maxPlayers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Start Game Section */}
          <div className="mt-8 text-center">
            {playersJoined >= 2 ? (
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-xl px-12 py-4"
                onClick={() => {
                  // Transition to character selection for all players
                  setGameMode('character-select');
                }}
              >
                🚀 Start Game ({playersJoined} players)
              </Button>
            ) : (
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-xl px-12 py-4"
                  onClick={() => {
                    createSessionMutation.mutate({
                      categoryId: currentSession.categoryId,
                      difficulty: currentSession.difficulty,
                      timePerQuestion: currentSession.timePerQuestion,
                      withBot: true
                    });
                  }}
                >
                  🤖 Add AI Bot & Start
                </Button>
                <p className="text-gray-500">Or wait for more players to join</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setGameMode('menu');
                    setCurrentSession(null);
                    wsRef.current?.close();
                  }}
                  className="ml-4"
                >
                  Cancel Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show ready to start screen when enough players have joined AND all have selected characters
  if (currentSession && currentSession.status === 'waiting' && (currentSession.participants?.length || 0) >= 2 && !currentSession.participants?.some(p => p.user.username === 'AI Bot') && currentSession.participants?.every(p => p.characterType && p.characterType !== 'balanced')) {
    const isHost = user && currentSession.hostUserId === user.id;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Battle!</h2>
            <p className="text-lg text-gray-600">
              All players have joined. {isHost ? 'Start the game when ready!' : 'Waiting for host to start the game.'}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Battle Participants ({currentSession.participants?.length || 0}/{currentSession.maxPlayers})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(currentSession.participants || []).map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <span className="font-medium">{participant.user.username}</span>
                      {participant.userId === currentSession.hostUserId && (
                        <Badge variant="secondary">Host</Badge>
                      )}
                    </div>
                    <Badge variant="default" className="bg-green-500">Ready</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            {isHost ? (
              <Button 
                size="lg"
                className="px-8"
                onClick={() => {
                  // Send start game message to server
                  if (wsRef.current && currentSession) {
                    console.log('Sending start-game message:', {
                      type: 'start-game',
                      userId: user?.id || 1,
                      sessionId: currentSession.id
                    });
                    wsRef.current.send(JSON.stringify({
                      type: 'start-game',
                      userId: user?.id || 1,
                      sessionId: currentSession.id
                    }));
                    console.log('Start game message sent');
                  } else {
                    console.error('WebSocket not connected or no current session');
                  }
                }}
              >
                Start Dungeon Adventure
              </Button>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Waiting for host to start the game...</span>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => {
                setGameMode('menu');
                setCurrentSession(null);
                wsRef.current?.close();
              }}
            >
              Leave Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sprite Selection Screen
  if (gameMode === 'character-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Choose Your Battle Sprite</h2>
            <p className="text-lg text-gray-600">Each character has unique abilities that affect gameplay</p>
            {currentSession && currentSession.participants && (
              <p className="text-sm text-gray-500 mt-2">
                Game Code: <span className="font-mono font-bold">{currentSession.sessionCode}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHARACTER_OPTIONS_DYNAMIC.map((character) => (
              <Card 
                key={character.id}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedSprite === character.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => selectSprite(character.id)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex flex-col items-center mb-2">
                    <img 
                      src={character.image} 
                      alt={character.name}
                      className="w-16 h-16 mb-2 pixel-art"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <CardTitle className="text-xl">{character.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">{character.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>HP:</span>
                      <span className="font-bold text-red-600">{character.baseStats.hp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attack:</span>
                      <span className="font-bold text-orange-600">{character.baseStats.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defense:</span>
                      <span className="font-bold text-blue-600">{character.baseStats.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-bold text-green-600">{character.baseStats.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-bold text-purple-600">{character.type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Select a character to continue to the lobby
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for bot battle to start
  if (gameMode === 'waiting-for-start' && currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/5 to-blue-500/5 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 text-green-600">⚔️ Battle Starting!</h2>
            <p className="text-lg text-gray-600">
              Both players are ready. Initializing battle...
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="text-center p-8">
              <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading battle arena...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameMode === 'lobby' && currentSession && currentSession.participants) {
    const isHost = currentSession.hostUserId === (user?.id || 1);
    const currentParticipant = currentSession.participants?.find(p => p.userId === (user?.id || 1));
    const allReady = currentSession.participants?.every(p => p.isReady) || false;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Game Lobby</h2>
            <div className="text-2xl font-mono bg-primary/10 inline-block px-4 py-2 rounded-lg">
              Code: {currentSession.sessionCode}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Players ({currentSession.participants?.length || 0}/{currentSession.maxPlayers})</span>
                <Badge variant={allReady ? "default" : "secondary"}>
                  {allReady ? "All Ready!" : "Waiting..."}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentSession.participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        {participant.user.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{participant.user.username}</span>
                      {participant.userId === currentSession.hostUserId && (
                        <Badge variant="outline">Host</Badge>
                      )}
                    </div>
                    <Badge variant={participant.isReady ? "default" : "secondary"}>
                      {participant.isReady ? "Ready" : "Not Ready"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            {!currentParticipant?.isReady ? (
              <Button onClick={markReady} className="px-8">
                Mark Ready
              </Button>
            ) : (
              <p className="text-muted-foreground">
                {allReady ? "Starting game..." : "Waiting for other players..."}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (gameMode === 'playing' && currentQuestion) {
    // Force fresh session data - prefer sessionData over currentSession for latest character info
    const activeSession = (sessionData as any)?.session || currentSession;
    const currentPlayer = activeSession?.participants?.find((p: any) => p.userId === (user?.id || 1));
    const opponent = activeSession?.participants?.find((p: any) => p.userId !== (user?.id || 1));
    
    // Debug logging to check character data
    console.log('Current player from session:', currentPlayer);
    console.log('Sprite type:', currentPlayer?.characterType, 'HP:', currentPlayer?.hp, 'Max HP:', currentPlayer?.maxHp);
    
    const currentPlayerCharacter = CHARACTER_OPTIONS_DYNAMIC.find(s => s.id === currentPlayer?.characterType) || CHARACTER_OPTIONS_DYNAMIC[0];
    const opponentCharacter = CHARACTER_OPTIONS_DYNAMIC.find(s => s.id === opponent?.characterType) || CHARACTER_OPTIONS_DYNAMIC[0];
    
    console.log('Calculated character:', currentPlayerCharacter.name, 'for character type:', currentPlayer?.characterType);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Dungeon Arena Header */}
          <div className="text-center mb-6">
            <div className="flex justify-between items-center mb-4">
              <Badge variant="outline" className="text-lg py-2 px-4">Question {questionIndex + 1}</Badge>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className={`font-mono text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>

          {/* Dungeon Arena - Pokemon Style Layout */}
          <div className="relative h-72 mb-6 bg-gradient-to-br from-green-200 via-green-300 to-green-400 border-4 border-black rounded-none overflow-hidden" style={{ imageRendering: 'pixelated' }}>
            {/* Opponent Sprite - Top Right */}
            <div className="absolute top-8 right-16">
              <img 
                src={opponentCharacter.image} 
                alt={opponentCharacter.name}
                className="w-32 h-32 transform scale-x-[-1] pixel-art drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Opponent Status Box - Top Left - Pokemon Style */}
            <div className="absolute top-4 left-4 bg-white border-4 border-black p-3 font-mono text-sm" style={{ 
              borderRadius: '8px',
              boxShadow: 'inset -2px -2px 0px #d1d5db, inset 2px 2px 0px #ffffff'
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-black uppercase tracking-wide">{opponent?.user?.username || 'OPPONENT'}</span>
                <span className="text-black">:L{(opponent?.userId || 1) % 30 + 15}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>HP</span>
                  <span>
                    {opponent?.hp || 50}/{opponent?.maxHp || 50}
                    {((opponent?.maxHp || 50) - (opponent?.hp || 50)) > 0 && (
                      <span className="text-red-600 ml-1">(-{(opponent?.maxHp || 50) - (opponent?.hp || 50)})</span>
                    )}
                  </span>
                </div>
                {/* Pokemon-style HP Bar */}
                <div className="relative bg-black border-2 border-black h-3">
                  <div className="absolute inset-0.5 bg-white">
                    <div 
                      className={`h-full transition-all duration-500 ${ 
                        ((opponent?.hp || 50) / (opponent?.maxHp || 50)) > 0.5 ? 'bg-green-500' :
                        ((opponent?.hp || 50) / (opponent?.maxHp || 50)) > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${((opponent?.hp || 50) / (opponent?.maxHp || 50)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700 font-bold">⚡{opponent?.energy || 0}</span>
                  <span className="text-gray-700 font-bold">{opponentCharacter.name.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* User Sprite - Bottom Left */}
            <div className="absolute bottom-8 left-16">
              <img 
                src={currentPlayerCharacter.image} 
                alt={currentPlayerCharacter.name}
                className="w-32 h-32 pixel-art drop-shadow-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* User Status Box - Bottom Right - Pokemon Style */}
            <div className="absolute bottom-4 right-4 bg-white border-4 border-black p-3 font-mono text-sm" style={{ 
              borderRadius: '8px',
              boxShadow: 'inset -2px -2px 0px #d1d5db, inset 2px 2px 0px #ffffff'
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-black uppercase tracking-wide">{currentPlayer?.user?.username || 'YOU'}</span>
                <span className="text-black">:L{(currentPlayer?.userId || 1) % 25 + 20}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>HP</span>
                  <span>
                    {currentPlayer?.hp || 50}/{currentPlayer?.maxHp || 50}
                    {((currentPlayer?.maxHp || 50) - (currentPlayer?.hp || 50)) > 0 && (
                      <span className="text-red-600 ml-1">(-{(currentPlayer?.maxHp || 50) - (currentPlayer?.hp || 50)})</span>
                    )}
                  </span>
                </div>
                {/* Pokemon-style HP Bar */}
                <div className="relative bg-black border-2 border-black h-3">
                  <div className="absolute inset-0.5 bg-white">
                    <div 
                      className={`h-full transition-all duration-500 ${ 
                        ((currentPlayer?.hp || 50) / (currentPlayer?.maxHp || 50)) > 0.5 ? 'bg-green-500' :
                        ((currentPlayer?.hp || 50) / (currentPlayer?.maxHp || 50)) > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${((currentPlayer?.hp || 50) / (currentPlayer?.maxHp || 50)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700 font-bold">⚡{currentPlayer?.energy || 0}</span>
                  <span className="text-gray-700 font-bold">{currentPlayerCharacter.name.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Battle Effects */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-4xl animate-bounce">⚡</div>
            </div>
          </div>

          {/* Hint Section - Moved higher up */}
          {currentQuestion.hint && (
            <Card id="battle-hint" className="border-orange-200 bg-orange-50 mb-4">
              <CardHeader>
                <CardTitle className="text-sm text-orange-700 flex items-center justify-between">
                  <div className="flex items-center">
                    💡 <span className="ml-2">Battle Hint</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 animate-pulse hover:animate-none"
                    onClick={() => showContextualGameHint('general', 
                      `Study the hint carefully! Look for keywords, patterns, or hidden meanings. In battle, correct answers give you energy while wrong ones cost HP. Use strategic thinking!`
                    )}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Tips
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-800">{currentQuestion.hint}</p>
              </CardContent>
            </Card>
          )}

          {/* Pokemon Style Question Box */}
          <div className="bg-white border-4 border-black p-6 mb-6 font-mono" style={{ 
            borderRadius: '12px',
            boxShadow: 'inset -3px -3px 0px #d1d5db, inset 3px 3px 0px #ffffff'
          }}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-2">
                BATTLE QUESTION #{questionIndex + 1}
              </h2>
              <div className="inline-block bg-gray-200 border-2 border-black px-3 py-1 font-bold text-sm">
                {currentQuestion.difficulty.toUpperCase()}
              </div>
            </div>
            
            <div className="bg-gray-100 border-2 border-black p-4 mb-4" style={{ borderRadius: '8px' }}>
              <p className="text-lg font-bold text-black text-center leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white border-2 border-black" style={{ borderRadius: '8px' }}>
                <input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full p-3 text-lg font-bold text-black bg-transparent border-none outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userAnswer.trim()) {
                      submitAnswer();
                    }
                  }}
                />
              </div>
              
              {/* Pokemon Style Battle Menu */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim()}
                  className={`bg-blue-200 border-3 border-black p-3 font-bold text-black uppercase tracking-wide hover:bg-blue-300 transition-colors ${
                    !userAnswer.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: '2px 2px 0px #666666'
                  }}
                >
                  SUBMIT
                </button>
                
                <button 
                  onClick={() => {
                    // Skip to next question with HP penalty
                    submitAnswer(); // This will treat empty answer as wrong and apply penalty
                  }}
                  className="bg-red-200 border-3 border-black p-3 font-bold text-black uppercase tracking-wide hover:bg-red-300 transition-colors"
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: '2px 2px 0px #666666'
                  }}
                >
                  SKIP
                </button>
                
                <button 
                  onClick={() => {
                    const hintElement = document.getElementById('battle-hint');
                    if (hintElement) {
                      hintElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-green-200 border-3 border-black p-3 font-bold text-black uppercase tracking-wide hover:bg-green-300 transition-colors"
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: '2px 2px 0px #666666'
                  }}
                >
                  HINT
                </button>
                
                <button 
                  className="bg-yellow-200 border-3 border-black p-3 font-bold text-black uppercase tracking-wide hover:bg-yellow-300 transition-colors"
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: '2px 2px 0px #666666'
                  }}
                >
                  STATS
                </button>
              </div>
            </div>
          </div>


          {/* Battle Move Animations */}
          <BattleMoveAnimation moves={currentMoves} isVisible={showMoveAnimations} />
          
          {/* Contextual Game Hint */}
          <ContextualGameHint 
            isVisible={showContextualHint}
            type={contextualHintType}
            message={hintMessage}
            onDismiss={dismissContextualHint}
          />
        </div>
      </div>
    );
  }

  // Finished Screen
  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Game Complete!</h2>
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Final Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(leaderboard || []).map((player, index) => (
                  <div key={player.userId} className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500' : 
                          index === 1 ? 'bg-gray-100 text-gray-800 border-2 border-gray-500' : 
                          index === 2 ? 'bg-amber-100 text-amber-800 border-2 border-amber-500' : 'bg-secondary text-secondary-foreground'}`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{player.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{player.score} pts</div>
                      <div className="text-sm text-muted-foreground">
                        {player.correctAnswers}/{player.totalAnswered} correct
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button 
              onClick={() => {
                setGameMode('menu');
                setCurrentSession(null);
                setLeaderboard([]);
                wsRef.current?.close();
              }}
              className="px-8"
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Action selection timer effect
  useEffect(() => {
    if (gameMode === 'action-select') {
      setActionTimer(15); // Reset timer when entering action-select mode
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'action-select' && actionTimer > 0) {
      const timer = setTimeout(() => {
        setActionTimer(actionTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (actionTimer === 0 && gameMode === 'action-select') {
      // Auto-select charge action if timer runs out
      selectBattleAction('charge');
    }
  }, [actionTimer, gameMode]);

  // Action Selection Screen (after correct answer)
  if (gameMode === 'action-select') {
    console.log('🚀 Rendering action-select screen!');
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-green-600">Correct Answer!</h2>
            <p className="text-lg text-gray-600">Choose your battle action:</p>
            <div className="mt-4">
              <div className={`text-2xl font-bold ${actionTimer <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                ⏰ {actionTimer}s remaining
              </div>
              <p className="text-sm text-gray-500">Auto-charges if time runs out</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 animate-pulse hover:animate-none"
              onClick={() => {
                const currentPlayer = currentSession?.participants?.find(p => p.userId === (user?.id || 1));
                const energy = currentPlayer?.energy || 0;
                showContextualGameHint('energy', 
                  `Energy Management Tip: You have ${energy} energy. Attack costs 5, Shield costs 3, Charge costs 2. Plan your moves strategically - save energy for powerful attacks or defensive shields!`
                );
              }}
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Strategy Tips
            </Button>
          </div>

          {currentSession && currentSession.participants && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentSession.participants?.map((participant) => (
                <HealthBar 
                  key={participant.id} 
                  participant={participant} 
                  isCurrentUser={participant.userId === (user?.id || 1)}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentSession && currentSession.participants && (() => {
              const currentPlayer = currentSession.participants?.find(p => p.userId === (user?.id || 1));
              const playerEnergy = currentPlayer?.energy || 0;
              
              return (
                <>
                  <Card className={`cursor-pointer transition-all border-2 ${
                    playerEnergy >= 5 ? 'hover:shadow-lg hover:border-red-500' : 'opacity-50 cursor-not-allowed border-gray-300'
                  }`} 
                        onClick={() => playerEnergy >= 5 && selectBattleAction('attack')}>
                    <CardContent className="p-6 text-center">
                      <Sword className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Attack</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Deal 10 damage to opponent (+{currentPlayer?.chargePower || 0} if charged)
                      </p>
                      <div className="text-xs">
                        <span className={`font-bold ${playerEnergy >= 5 ? 'text-purple-600' : 'text-red-600'}`}>
                          Costs 5 energy {playerEnergy >= 5 ? '✓' : '✗'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {(() => {
                    const characterInfo = CHARACTER_OPTIONS.find(s => s.id === currentPlayer?.characterType) || CHARACTER_OPTIONS[4];
                    const hasReflect = characterInfo.abilities.some(ability => ability.special === 'reflect_damage');
                    
                    if (hasReflect) {
                      return (
                        <Card className={`cursor-pointer transition-all border-2 ${
                          playerEnergy >= 5 ? 'hover:shadow-lg hover:border-purple-500' : 'opacity-50 cursor-not-allowed border-gray-300'
                        }`} 
                              onClick={() => playerEnergy >= 5 && selectBattleAction('reflect')}>
                          <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 text-purple-500 mx-auto mb-4 text-2xl flex items-center justify-center">
                              🪞
                            </div>
                            <h3 className="text-xl font-bold mb-2">Reflect</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Reflect the next attack back to your opponent
                            </p>
                            <div className="text-xs">
                              <span className={`font-bold ${playerEnergy >= 5 ? 'text-purple-600' : 'text-red-600'}`}>
                                Costs 5 energy {playerEnergy >= 5 ? '✓' : '✗'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    } else {
                      return (
                        <Card className={`cursor-pointer transition-all border-2 ${
                          playerEnergy >= 3 ? 'hover:shadow-lg hover:border-blue-500' : 'opacity-50 cursor-not-allowed border-gray-300'
                        }`} 
                              onClick={() => playerEnergy >= 3 && selectBattleAction('shield')}>
                          <CardContent className="p-6 text-center">
                            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Shield</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Block the next attack from your opponent
                            </p>
                            <div className="text-xs">
                              <span className={`font-bold ${playerEnergy >= 3 ? 'text-purple-600' : 'text-red-600'}`}>
                                Costs 3 energy {playerEnergy >= 3 ? '✓' : '✗'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}

                  <Card className={`cursor-pointer transition-all border-2 ${
                    playerEnergy >= 2 ? 'hover:shadow-lg hover:border-orange-500' : 'opacity-50 cursor-not-allowed border-gray-300'
                  }`} 
                        onClick={() => playerEnergy >= 2 && selectBattleAction('charge')}>
                    <CardContent className="p-6 text-center">
                      <Battery className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Charge</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Add +5 damage to your next attack
                      </p>
                      <div className="text-xs">
                        <span className={`font-bold ${playerEnergy >= 2 ? 'text-purple-600' : 'text-red-600'}`}>
                          Costs 2 energy {playerEnergy >= 2 ? '✓' : '✗'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
          
          {/* Contextual Game Hint */}
          <ContextualGameHint 
            isVisible={showContextualHint}
            type={contextualHintType}
            message={hintMessage}
            onDismiss={dismissContextualHint}
          />
        </div>
      </div>
    );
  }

  // Battle Result Screen
  if (gameMode === 'battle-result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500/10 to-red-500/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Battle Results</h2>
            {battleResult && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-2">
                  You used: <span className="capitalize text-primary">{pendingBattleAction}</span>
                </h3>
                {battleResult.damage > 0 && (
                  <p className="text-lg text-red-600">
                    Dealt {battleResult.damage} damage to opponent!
                  </p>
                )}
                {battleResult.shieldBroken && (
                  <p className="text-lg text-blue-600">
                    Enemy shield was broken!
                  </p>
                )}
                {battleResult.targetHP <= 0 && (
                  <p className="text-xl font-bold text-green-600">
                    Victory! Enemy defeated!
                  </p>
                )}
              </div>
            )}
          </div>

          {currentSession && currentSession.participants && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentSession.participants?.map((participant) => (
                <HealthBar 
                  key={participant.id} 
                  participant={participant} 
                  isCurrentUser={participant.userId === (user?.id || 1)}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-600 mb-4">Waiting for next question...</p>
          </div>
        </div>
      </div>
    );
  }

  // Wrong Answer Modal
  const wrongAnswerModal = (
    <WrongAnswerModal
      isOpen={isWrongModalOpen}
      onClose={() => setIsWrongModalOpen(false)}
      userAnswer={lastUserAnswer}
      onShowAnswer={handleShowAnswer}
      onTryAgain={handleTryAgain}
      onNextQuestion={handleNextQuestion}
      hint={currentQuestion?.hint || 'Try thinking about this differently!'}
      isAttemptsExhausted={attemptsUsed >= MAX_ATTEMPTS}
    />
  );

  // Default fallback - loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading Game...</h3>
            <p className="text-muted-foreground">
              Current mode: {gameMode || 'unknown'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setGameMode('menu')} 
              className="mt-4"
            >
              Return to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
      {wrongAnswerModal}
    </div>
  );
}
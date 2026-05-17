import { create } from 'zustand';

export type GameState = 'LOBBY' | 'PREPARE' | 'PLAYING' | 'ELIMINATED' | 'VICTORY' | 'DUEL';
export type GameMode = 'NORMAL' | 'SURVIVAL' | 'BLITZ';

export interface Command {
  id: string;
  text: string;
  type: 'TAP' | 'SWIPE' | 'HOLD' | 'COLOR' | 'MATH';
  action: string;
  target: string;
  difficulty: number;
  theme?: string;
}

interface BrainLagState {
  gameState: GameState;
  gameMode: GameMode;
  score: number;
  combo: number;
  multiplier: number;
  maxCombo: number;
  timeRemaining: number;
  currentCommand: Command | null;
  playersCount: number;
  lastError: string | null;
  isMultiplayer: boolean;
  roomCode: string | null;
  roomId: string | null;
  isHost: boolean;
  userSkin: string | null;
  userTitle: string | null;
  userFont: any | null;
  userArenaEffect: any | null;
  userIcon: string | null;
  userEffect: any | null;
  selectedThemes: string[];
  baseTime: number;
  accelerationEnabled: boolean;
  accelerationIntensity: 'OFF' | 'SLOW' | 'NORMAL' | 'INSANE';
  duelOpponentProgress: number;
  duelOpponentId: string | null;
  duelSeed: number | null;
  activePowers: { id: string, expiresAt: number }[];
  coins: number;
  powerSlowCount: number;
  powerShieldCount: number;
  hasShield: boolean;
  powersUsedInSession: { slow: number, shield: number };
  sessionUsedPower: boolean;
  
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  setSelectedThemes: (themes: string[]) => void;
  setGameSettings: (baseTime: number, accelerationIntensity: 'OFF' | 'SLOW' | 'NORMAL' | 'INSANE') => void;
  startGame: (mode?: GameMode, themes?: string[], baseTime?: number, accelerationIntensity?: 'OFF' | 'SLOW' | 'NORMAL' | 'INSANE') => void;
  endGame: (reason: string) => void;
  updateScore: (points: number) => void;
  setCommand: (command: Command | null) => void;
  tick: (delta: number) => void;
  setRoom: (id: string | null, code: string | null, isHost: boolean) => void;
  setCustomization: (skin: string | null, title: string | null, font?: any, arenaEffect?: any, icon?: string | null, effect?: any) => void;
  setPowerCounts: (slow: number, shield: number) => void;
  increaseCombo: (reactionTime: number) => void;
  setDuelOpponent: (id: string | null, progress: number) => void;
  usePower: (powerId: string) => void;
  resetCombo: () => void;
}

export const useGameStore = create<BrainLagState>((set, get) => ({
  gameState: 'LOBBY',
  gameMode: 'NORMAL',
  score: 0,
  combo: 0,
  multiplier: 1,
  maxCombo: 0,
  timeRemaining: 10,
  currentCommand: null,
  playersCount: 0,
  lastError: null,
  isMultiplayer: false,
  roomCode: null,
  roomId: null,
  isHost: false,
  userSkin: '#06b6d4', // Padrão cyan-400
  userTitle: null,
  userFont: null,
  userArenaEffect: null,
  userIcon: null,
  userEffect: null,
  selectedThemes: ['COLOR', 'MATH'],
  baseTime: 2.2,
  accelerationIntensity: 'NORMAL',
  accelerationEnabled: true,
  duelOpponentProgress: 0,
  duelOpponentId: null,
  duelSeed: null,
  activePowers: [],
  coins: 0,
  powerSlowCount: 0,
  powerShieldCount: 0,
  hasShield: false,
  powersUsedInSession: { slow: 0, shield: 0 },
  sessionUsedPower: false,

  setCustomization: (skin, title, font, arenaEffect) => set({ 
    userSkin: skin, 
    userTitle: title,
    userFont: font || null,
    userArenaEffect: arenaEffect || null
  }),
  setPowerCounts: (slow, shield) => set({ powerSlowCount: slow, powerShieldCount: shield }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setSelectedThemes: (themes) => set({ selectedThemes: themes }),
  setGameSettings: (baseTime, accelerationIntensity) => set({ baseTime, accelerationIntensity, accelerationEnabled: accelerationIntensity !== 'OFF' }),
  setGameState: (state) => set({ gameState: state }),
  
  startGame: (mode = 'NORMAL', themes, baseTime, accelerationIntensity) => {
    const state = get();
    const currentThemes = themes || state.selectedThemes;
    const currentBaseTime = baseTime !== undefined ? baseTime : state.baseTime;
    const currentAccelerationIntensity = accelerationIntensity !== undefined ? accelerationIntensity : state.accelerationIntensity;
    const currentAcceleration = currentAccelerationIntensity !== 'OFF';

    set({ 
      gameState: 'PREPARE', 
      gameMode: mode,
      selectedThemes: currentThemes,
      baseTime: currentBaseTime,
      accelerationIntensity: currentAccelerationIntensity,
      accelerationEnabled: currentAcceleration,
      score: 0, 
      combo: 0,
      multiplier: 1,
      maxCombo: 0,
      timeRemaining: mode === 'BLITZ' ? 1.2 : (mode === 'SURVIVAL' ? 5 : currentBaseTime),
      lastError: null,
      duelSeed: mode === 'NORMAL' && state.isMultiplayer ? Math.floor(Math.random() * 1000000) : null,
      duelOpponentProgress: 0,
      powersUsedInSession: { slow: 0, shield: 0 },
      sessionUsedPower: false
    });
  },

  setRoom: (id, code, isHost) => set({ 
    roomId: id, 
    roomCode: code, 
    isHost, 
    isMultiplayer: !!id 
  }),

  endGame: (reason) => set({ 
    gameState: 'ELIMINATED', 
    lastError: reason 
  }),

  updateScore: (points) => set((state) => ({ score: state.score + (points * state.multiplier) })),

  setCommand: (command) => set({ currentCommand: command }),

  tick: (delta) => set((state) => {
    if (state.gameState !== 'PLAYING') return state;
    
    // Check for "Slow Motion" power
    const hasSlowMotion = state.activePowers.some(p => p.id === 'slow' && p.expiresAt > Date.now());
    const actualDelta = hasSlowMotion ? delta * 0.4 : delta;
    
    const nextTime = state.timeRemaining - actualDelta;
    if (nextTime <= 0) {
      const errorMsg = state.gameMode === 'SURVIVAL' ? 'RECARGA NEURAL FALHOU!' : 'TEMPO ESGOTADO!';
      return { gameState: 'ELIMINATED', timeRemaining: 0, lastError: errorMsg };
    }
    
    // Cleanup expired powers
    const now = Date.now();
    const activePowers = state.activePowers.filter(p => p.expiresAt > now);
    
    return { timeRemaining: nextTime, activePowers };
  }),
  increaseCombo: (reactionTime) => set((state) => {
    const newCombo = state.combo + 1;
    let newMultiplier = 1;
    
    // Multiplier logic based on reaction time
    if (reactionTime < 0.6) {
      newMultiplier = Math.min(4, state.multiplier + 0.5);
    } else if (reactionTime < 1.2) {
      newMultiplier = Math.min(2, state.multiplier + 0.2);
    } else {
      newMultiplier = 1;
    }

    return { 
      combo: newCombo, 
      multiplier: newMultiplier,
      maxCombo: Math.max(state.maxCombo, newCombo)
    };
  }),

  setDuelOpponent: (id, progress) => set({ duelOpponentId: id, duelOpponentProgress: progress }),
  usePower: (powerId) => set((state) => {
    if (powerId === 'slow') {
      if (state.powerSlowCount <= 0) return state;
      const expiresAt = Date.now() + 5000;
      return { 
        activePowers: [...state.activePowers, { id: powerId, expiresAt }],
        powerSlowCount: state.powerSlowCount - 1,
        powersUsedInSession: { ...state.powersUsedInSession, slow: state.powersUsedInSession.slow + 1 },
        sessionUsedPower: true
      };
    }
    if (powerId === 'shield') {
      if (state.powerShieldCount <= 0 || state.hasShield) return state;
      return { 
        hasShield: true,
        powerShieldCount: state.powerShieldCount - 1,
        powersUsedInSession: { ...state.powersUsedInSession, shield: state.powersUsedInSession.shield + 1 },
        sessionUsedPower: true
      };
    }
    return state;
  }),
  resetCombo: () => set({ combo: 0, multiplier: 1 }),
}));
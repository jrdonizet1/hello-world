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
  selectedThemes: string[];
  baseTime: number;
  accelerationEnabled: boolean;
  accelerationIntensity: 'OFF' | 'SLOW' | 'NORMAL' | 'INSANE';
  duelOpponentProgress: number;
  duelOpponentId: string | null;
  duelSeed: number | null;
  
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
  setCustomization: (skin: string | null, title: string | null, font?: any, arenaEffect?: any) => void;
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
  selectedThemes: ['COLOR', 'MATH'],
  baseTime: 2.2,
  accelerationIntensity: 'NORMAL',
  accelerationEnabled: true,
  duelOpponentProgress: 0,
  duelOpponentId: null,
  duelSeed: null,

  setCustomization: (skin, title, font, arenaEffect) => set({ 
    userSkin: skin, 
    userTitle: title,
    userFont: font || null,
    userArenaEffect: arenaEffect || null
  }),
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
      duelOpponentProgress: 0
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
    const nextTime = state.timeRemaining - delta;
    if (nextTime <= 0) {
      const errorMsg = state.gameMode === 'SURVIVAL' ? 'RECARGA NEURAL FALHOU!' : 'TEMPO ESGOTADO!';
      return { gameState: 'ELIMINATED', timeRemaining: 0, lastError: errorMsg };
    }
    return { timeRemaining: nextTime };
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
  resetCombo: () => set({ combo: 0, multiplier: 1 }),
}));
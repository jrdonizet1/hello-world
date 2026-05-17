import { create } from 'zustand';

export type GameState = 'LOBBY' | 'PREPARE' | 'PLAYING' | 'ELIMINATED' | 'VICTORY';
export type GameMode = 'NORMAL' | 'SURVIVAL' | 'BLITZ';

export interface Command {
  id: string;
  text: string;
  type: 'TAP' | 'SWIPE' | 'HOLD' | 'COLOR' | 'MATH';
  action: string;
  target: string;
  difficulty: number;
}

interface BrainLagState {
  gameState: GameState;
  gameMode: GameMode;
  score: number;
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
  selectedThemes: string[];
  baseTime: number;
  accelerationEnabled: boolean;
  
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  setSelectedThemes: (themes: string[]) => void;
  setGameSettings: (baseTime: number, accelerationEnabled: boolean) => void;
  startGame: (mode?: GameMode, themes?: string[], baseTime?: number, accelerationEnabled?: boolean) => void;
  endGame: (reason: string) => void;
  updateScore: (points: number) => void;
  setCommand: (command: Command | null) => void;
  tick: (delta: number) => void;
  setRoom: (id: string | null, code: string | null, isHost: boolean) => void;
  setCustomization: (skin: string | null, title: string | null) => void;
}

export const useGameStore = create<BrainLagState>((set, get) => ({
  gameState: 'LOBBY',
  gameMode: 'NORMAL',
  score: 0,
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
  selectedThemes: ['COLOR', 'MATH'],

  setCustomization: (skin, title) => set({ userSkin: skin, userTitle: title }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setSelectedThemes: (themes) => set({ selectedThemes: themes }),
  setGameState: (state) => set({ gameState: state }),
  
  startGame: (mode = 'NORMAL', themes) => {
    const currentThemes = themes || get().selectedThemes;
    set({ 
      gameState: 'PREPARE', 
      gameMode: mode,
      selectedThemes: currentThemes,
      score: 0, 
      timeRemaining: mode === 'BLITZ' ? 1.2 : (mode === 'SURVIVAL' ? 5 : 10),
      lastError: null 
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

  updateScore: (points) => set((state) => ({ score: state.score + points })),

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
}));
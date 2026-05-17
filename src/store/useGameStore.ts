import { create } from 'zustand';

export type GameState = 'LOBBY' | 'PREPARE' | 'PLAYING' | 'ELIMINATED' | 'VICTORY';

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
  score: number;
  timeRemaining: number;
  currentCommand: Command | null;
  playersCount: number;
  lastError: string | null;
  isMultiplayer: boolean;
  roomCode: string | null;
  roomId: string | null;
  isHost: boolean;
  
  setGameState: (state: GameState) => void;
  startGame: () => void;
  endGame: (reason: string) => void;
  updateScore: (points: number) => void;
  setCommand: (command: Command | null) => void;
  tick: (delta: number) => void;
  setRoom: (id: string | null, code: string | null, isHost: boolean) => void;
}

export const useGameStore = create<BrainLagState>((set, get) => ({
  gameState: 'LOBBY',
  score: 0,
  timeRemaining: 10,
  currentCommand: null,
  playersCount: 0,
  lastError: null,
  isMultiplayer: false,
  roomCode: null,
  roomId: null,
  isHost: false,

  setGameState: (state) => set({ gameState: state }),
  
  startGame: () => set({ 
    gameState: 'PREPARE', 
    score: 0, 
    timeRemaining: 10,
    lastError: null 
  }),

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
      return { gameState: 'ELIMINATED', timeRemaining: 0, lastError: 'TEMPO ESGOTADO!' };
    }
    return { timeRemaining: nextTime };
  }),
}));

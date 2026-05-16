import { Command } from '../store/useGameStore';

const COMMANDS: Omit<Command, 'id'>[] = [
  { text: 'TOQUE NO VERMELHO', type: 'COLOR', action: 'tap', target: 'red', difficulty: 1 },
  { text: 'NÃO TOQUE NO AZUL', type: 'COLOR', action: 'not_tap', target: 'blue', difficulty: 2 },
  { text: 'ESCOLHA O VERDE', type: 'COLOR', action: 'tap', target: 'green', difficulty: 1 },
  { text: 'ESQUEÇA O AMARELO', type: 'COLOR', action: 'not_tap', target: 'yellow', difficulty: 2 },
  { text: 'CLIQUE NO AZUL', type: 'COLOR', action: 'tap', target: 'blue', difficulty: 1 },
  { text: 'SWIPE NÃO DISPONÍVEL', type: 'TAP', action: 'tap', target: 'any', difficulty: 3 },
  { text: '2 + 2 = 4?', type: 'MATH', action: 'math_4', target: '4', difficulty: 1 },
  { text: '10 - 3 = 7?', type: 'MATH', action: 'math_4', target: '4', difficulty: 2 },
];

export const generateCommand = (difficulty: number): Command => {
  const filtered = COMMANDS.filter(c => c.difficulty <= difficulty);
  const base = filtered[Math.floor(Math.random() * filtered.length)];
  return {
    ...base,
    id: Math.random().toString(36).substring(7),
  };
};

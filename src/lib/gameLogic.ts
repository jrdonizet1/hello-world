import { Command } from '../store/useGameStore';

const COMMANDS: Omit<Command, 'id'>[] = [
  { text: 'TOQUE NO VERMELHO', type: 'COLOR', action: 'tap', target: 'red', difficulty: 1 },
  { text: 'NÃO TOQUE NO AZUL', type: 'COLOR', action: 'not_tap', target: 'blue', difficulty: 2 },
  { text: 'TOQUE NO TEXTO, NÃO NA COR', type: 'COLOR', action: 'tap_text', target: 'any', difficulty: 3 },
  { text: 'SWIPE PARA A ESQUERDA', type: 'SWIPE', action: 'swipe_left', target: 'left', difficulty: 1 },
  { text: 'SWIPE PARA O LADO OPOSTO', type: 'SWIPE', action: 'swipe_right', target: 'right', difficulty: 3 },
  { text: 'SEGURE POR 1 SEGUNDO', type: 'HOLD', action: 'hold', target: '1s', difficulty: 2 },
  { text: '2 + 2 = ?', type: 'MATH', action: 'math_4', target: '4', difficulty: 1 },
  { text: 'CLIQUE NO MENOR NÚMERO', type: 'MATH', action: 'min', target: 'any', difficulty: 2 },
];

export const generateCommand = (difficulty: number): Command => {
  const filtered = COMMANDS.filter(c => c.difficulty <= difficulty);
  const base = filtered[Math.floor(Math.random() * filtered.length)];
  return {
    ...base,
    id: Math.random().toString(36).substring(7),
  };
};

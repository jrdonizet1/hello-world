import { Command } from '../store/useGameStore';

export interface StroopCommand extends Command {
  displayWord: string;
  displayColor: string;
  isCorrect: boolean;
}

const COLORS = [
  { name: 'VERMELHO', value: '#ef4444', key: 'red' },
  { name: 'AZUL', value: '#3b82f6', key: 'blue' },
  { name: 'VERDE', value: '#22c55e', key: 'green' },
  { name: 'AMARELO', value: '#eab308', key: 'yellow' },
  { name: 'ROXO', value: '#a855f7', key: 'purple' },
  { name: 'ROSA', value: '#ec4899', key: 'pink' },
];

export const generateCommand = (difficulty: number): StroopCommand => {
  // 50/50 chance of being a matching or non-matching color
  const isCorrect = Math.random() > 0.5;
  
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  const word = COLORS[wordIndex];
  
  let colorValue: string;
  if (isCorrect) {
    colorValue = word.value;
  } else {
    let colorIndex;
    do {
      colorIndex = Math.floor(Math.random() * COLORS.length);
    } while (colorIndex === wordIndex);
    colorValue = COLORS[colorIndex].value;
  }

  return {
    id: Math.random().toString(36).substring(7),
    text: 'A COR BATE COM A PALAVRA?',
    displayWord: word.name,
    displayColor: colorValue,
    isCorrect,
    type: 'COLOR',
    action: 'boolean',
    target: isCorrect ? 'true' : 'false',
    difficulty,
  };
};

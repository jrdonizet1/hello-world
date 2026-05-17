import { Command } from '../store/useGameStore';

export interface GameCommand extends Command {
  displayWord: string;
  displayColor?: string;
  isCorrect: boolean;
}

export type GameTheme = 'COLOR' | 'MATH' | 'GENERAL' | 'CURIOSITY';

const COLORS = [
  { name: 'VERMELHO', value: '#ef4444' },
  { name: 'AZUL', value: '#3b82f6' },
  { name: 'VERDE', value: '#22c55e' },
  { name: 'AMARELO', value: '#eab308' },
  { name: 'ROXO', value: '#a855f7' },
  { name: 'ROSA', value: '#ec4899' },
  { name: 'CIANO', value: '#06b6d4' },
  { name: 'LARANJA', value: '#f97316' },
];

const GENERAL_QUESTIONS = [
  { q: 'O CÉU É AZUL?', a: true },
  { q: 'O FOGO É QUENTE?', a: true },
  { q: 'GELOS SÃO QUENTES?', a: false },
  { q: '2 + 2 = 5?', a: false },
  { q: 'GATOS LATEM?', a: false },
  { q: 'O SOL É UMA ESTRELA?', a: true },
  { q: 'PEIXES VOAM?', a: false },
  { q: 'A TERRA É PLANA?', a: false },
  { q: 'BRASIL ESTÁ NA EUROPA?', a: false },
  { q: 'A LUA É FEITA DE QUEIJO?', a: false },
];

const CURIOSITIES = [
  { q: 'BANANAS SÃO BAGAS?', a: true, difficulty: 2 },
  { q: 'BALEIAS SÃO PEIXES?', a: false, difficulty: 1 },
  { q: 'O BATMAN É DA MARVEL?', a: false, difficulty: 1 },
  { q: 'TUBARÕES SÃO MAMÍFEROS?', a: false, difficulty: 2 },
  { q: 'POLVOS TÊM 3 CORAÇÕES?', a: true, difficulty: 3 },
  { q: 'DIAMANTES VÊM DO CARVÃO?', a: true, difficulty: 2 },
  { q: 'O MONTE EVEREST É NO BRASIL?', a: false, difficulty: 1 },
  { q: 'TOMATES SÃO FRUTAS?', a: true, difficulty: 1 },
  { q: 'CANGURUS PODEM ANDAR PARA TRÁS?', a: false, difficulty: 3 },
  { q: 'FORMIGAS NUNCA DORMEM?', a: false, difficulty: 3 },
];

export const generateCommand = (difficulty: number, themes: string[] = ['COLOR', 'MATH']): GameCommand => {
  const selectedTheme = themes[Math.floor(Math.random() * themes.length)] as GameTheme;
  const isCorrect = Math.random() > 0.5;

  if (selectedTheme === 'COLOR') {
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
  } else if (selectedTheme === 'MATH') {
    // Increase math difficulty
    const range = 5 + (difficulty * 2);
    const operations = difficulty > 5 ? ['+', '-', '*'] : ['+', '-'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    
    let a, b, result;
    if (op === '+') {
      a = Math.floor(Math.random() * range);
      b = Math.floor(Math.random() * range);
      result = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * range) + 5;
      b = Math.floor(Math.random() * a);
      result = a - b;
    } else {
      a = Math.floor(Math.random() * 10);
      b = Math.floor(Math.random() * 5);
      result = a * b;
    }

    const displayResult = isCorrect ? result : result + (Math.random() > 0.5 ? 1 : -1);

    return {
      id: Math.random().toString(36).substring(7),
      text: 'ESTA CONTA ESTÁ CORRETA?',
      displayWord: `${a} ${op} ${b} = ${displayResult}`,
      isCorrect,
      type: 'MATH',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  } else if (selectedTheme === 'GENERAL') {
    const pool = GENERAL_QUESTIONS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    const displayIsCorrect = isCorrect ? item.a : !item.a;
    
    return {
      id: Math.random().toString(36).substring(7),
      text: item.q,
      displayWord: isCorrect ? 'SIM' : 'NÃO',
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  } else {
    // CURIOSITY
    const filteredPool = CURIOSITIES.filter(c => c.difficulty <= (difficulty / 2) + 1);
    const pool = filteredPool.length > 0 ? filteredPool : CURIOSITIES;
    const item = pool[Math.floor(Math.random() * pool.length)];
    
    return {
      id: Math.random().toString(36).substring(7),
      text: item.q,
      displayWord: isCorrect ? 'SIM' : 'NÃO',
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  }
};

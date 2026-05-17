import { Command } from '../store/useGameStore';

export interface GameCommand extends Command {
  displayWord: string;
  displayColor?: string;
  isCorrect: boolean;
}

export type GameTheme = 'COLOR' | 'MATH' | 'GENERAL' | 'CURIOSITY' | 'SEQUENCE' | 'CAPITAL' | 'SCALE';

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
  { q: 'CACHORROS MIARE?', a: false },
  { q: 'O ANO TEM 12 MESES?', a: true },
  { q: 'O ALFABETO TEM 26 LETRAS?', a: true },
  { q: 'PÁSSAROS TÊM PELOS?', a: false },
  { q: 'O GELO É ÁGUA SÓLIDA?', a: true },
  { q: 'O NARIZ SERVE PARA OUVIR?', a: false },
  { q: 'A SEMANA TEM 7 DIAS?', a: true },
  { q: 'O LEITE É VERMELHO?', a: false },
  { q: 'A GRAMA É VERDE?', a: true },
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
  { q: 'A TORRE EIFFEL PODE FICAR MAIOR NO VERÃO?', a: true, difficulty: 4 },
  { q: 'MEL NUNCA ESTRAGA?', a: true, difficulty: 4 },
  { q: 'O CORAÇÃO DE UM CAMARÃO FICA NA CABEÇA?', a: true, difficulty: 5 },
  { q: 'CARACÓIS PODEM DORMIR POR 3 ANOS?', a: true, difficulty: 5 },
  { q: 'O ISQUEIRO FOI INVENTADO ANTES DO FÓSFORO?', a: true, difficulty: 5 },
  { q: 'COELHOS PODEM VOMITAR?', a: false, difficulty: 4 },
  { q: 'CÃES SÓ ENXERGAM EM PRETO E BRANCO?', a: false, difficulty: 2 },
];

  const CAPITALS = [
  { country: 'FRANÇA', capital: 'PARIS' },
  { country: 'ITÁLIA', capital: 'ROMA' },
  { country: 'JAPÃO', capital: 'TÓQUIO' },
  { country: 'ESTADOS UNIDOS', capital: 'WASHINGTON' },
  { country: 'ALEMANHA', capital: 'BERLIM' },
  { country: 'PORTUGAL', capital: 'LISBOA' },
  { country: 'ESPANHA', capital: 'MADRI' },
  { country: 'REINO UNIDO', capital: 'LONDRES' },
  { country: 'ARGENTINA', capital: 'BUENOS AIRES' },
  { country: 'CHINA', capital: 'PEQUIM' },
  { country: 'CANADÁ', capital: 'OTTAWA' },
  { country: 'AUSTRÁLIA', capital: 'CANBERRA' },
  { country: 'RÚSSIA', capital: 'MOSCOU' },
  { country: 'EGITO', capital: 'CAIRO' },
];

const SCALES = [
  { item: 'ELEFANTE', size: 100 },
  { item: 'FORMIGA', size: 1 },
  { item: 'BALEIA', size: 500 },
  { item: 'GATO', size: 10 },
  { item: 'PRÉDIO', size: 1000 },
  { item: 'CARRO', size: 50 },
  { item: 'AVIÃO', size: 800 },
  { item: 'PLANETA TERRA', size: 1000000 },
  { item: 'SOL', size: 100000000 },
  { item: 'GRÃO DE AREIA', size: 0.1 },
  { item: 'MOSQUITO', size: 0.5 },
  { item: 'MONTANHA', size: 5000 },
  { item: 'CANETA', size: 2 },
  { item: 'CELULAR', size: 3 },
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
    
    return {
      id: Math.random().toString(36).substring(7),
      text: item.q,
      displayWord: isCorrect ? (item.a ? 'SIM' : 'NÃO') : (item.a ? 'NÃO' : 'SIM'),
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  } else if (selectedTheme === 'CURIOSITY') {
    const filteredPool = CURIOSITIES.filter(c => c.difficulty <= (difficulty / 2) + 1);
    const pool = filteredPool.length > 0 ? filteredPool : CURIOSITIES;
    const item = pool[Math.floor(Math.random() * pool.length)];
    
    return {
      id: Math.random().toString(36).substring(7),
      text: item.q,
      displayWord: isCorrect ? (item.a ? 'SIM' : 'NÃO') : (item.a ? 'NÃO' : 'SIM'),
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  } else if (selectedTheme === 'SEQUENCE') {
    const types = ['CORES', 'NÚMEROS'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'CORES') {
      const c1 = COLORS[Math.floor(Math.random() * COLORS.length)];
      const c2 = COLORS[Math.floor(Math.random() * COLORS.length)];
      const pattern = [c1.name, c2.name, c1.name];
      const nextCorrect = c2.name;
      const nextWrong = c1.name;
      const displayNext = isCorrect ? nextCorrect : nextWrong;
      
      return {
        id: Math.random().toString(36).substring(7),
        text: 'QUAL O PRÓXIMO?',
        displayWord: `${pattern.join(', ')} → ${displayNext}?`,
        isCorrect,
        type: 'TAP',
        action: 'boolean',
        target: isCorrect ? 'true' : 'false',
        difficulty,
      };
    } else {
      const start = Math.floor(Math.random() * 10);
      const step = Math.floor(Math.random() * 3) + 1;
      const pattern = [start, start + step, start + (step * 2)];
      const nextCorrect = start + (step * 3);
      const nextWrong = nextCorrect + (Math.random() > 0.5 ? 1 : -1);
      const displayNext = isCorrect ? nextCorrect : nextWrong;
      
      return {
        id: Math.random().toString(36).substring(7),
        text: 'QUAL O PRÓXIMO?',
        displayWord: `${pattern.join(', ')} → ${displayNext}?`,
        isCorrect,
        type: 'TAP',
        action: 'boolean',
        target: isCorrect ? 'true' : 'false',
        difficulty,
      };
    }
  } else if (selectedTheme === 'CAPITAL') {
    const item = CAPITALS[Math.floor(Math.random() * CAPITALS.length)];
    let displayCapital: string;
    
    if (isCorrect) {
      displayCapital = item.capital;
    } else {
      let otherItem;
      do {
        otherItem = CAPITALS[Math.floor(Math.random() * CAPITALS.length)];
      } while (otherItem.capital === item.capital);
      displayCapital = otherItem.capital;
    }
    
    return {
      id: Math.random().toString(36).substring(7),
      text: `CAPITAL DE: ${item.country}?`,
      displayWord: `${displayCapital}?`,
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  } else {
    // SCALE
    const item1 = SCALES[Math.floor(Math.random() * SCALES.length)];
    let item2;
    do {
      item2 = SCALES[Math.floor(Math.random() * SCALES.length)];
    } while (item1.item === item2.item);
    
    const actuallyGreater = item1.size > item2.size;
    
    // We want to ask "Is item1 bigger than item2?"
    // isCorrect means we want the user to press SIM if the statement we show is actually correct.
    
    const statementIsTrue = isCorrect; 
    // If isCorrect is true, we want a true statement.
    // If isCorrect is false, we want a false statement.
    
    let text: string;
    if (statementIsTrue) {
      if (actuallyGreater) {
        text = `UM(A) ${item1.item} É MAIOR QUE UM(A) ${item2.item}?`;
      } else {
        text = `UM(A) ${item2.item} É MAIOR QUE UM(A) ${item1.item}?`;
      }
    } else {
      if (actuallyGreater) {
        text = `UM(A) ${item2.item} É MAIOR QUE UM(A) ${item1.item}?`;
      } else {
        text = `UM(A) ${item1.item} É MAIOR QUE UM(A) ${item2.item}?`;
      }
    }

    return {
      id: Math.random().toString(36).substring(7),
      text: 'ISSO É VERDADE?',
      displayWord: text,
      isCorrect,
      type: 'TAP',
      action: 'boolean',
      target: isCorrect ? 'true' : 'false',
      difficulty,
    };
  }
};

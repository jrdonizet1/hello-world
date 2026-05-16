import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { RefreshCw, Share2, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GameOver: React.FC = () => {
  const { score, lastError, startGame, setGameState } = useGameStore();

  React.useEffect(() => {
    if (score > 10) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2ff', '#ffffff', '#ff0055']
      });
    }
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-red-950/20">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2 mb-12"
      >
        <h1 className="text-7xl font-black text-red-500 italic">BRAIN LAG</h1>
        <p className="text-xl font-bold text-white/60 uppercase tracking-tighter">{lastError || 'FIM DE JOGO'}</p>
      </motion.div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase">Pontuação Final</p>
            <p className="text-6xl font-black italic">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold uppercase">Rank</p>
            <p className="text-2xl font-black text-cyan-400">#42,901</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm border-b border-white/5 pb-2">
            <span className="text-gray-400">Tempo Sobrevivido</span>
            <span className="font-mono">{(score * 1.5).toFixed(1)}s</span>
          </div>
          <div className="flex justify-between text-sm border-b border-white/5 pb-2">
            <span className="text-gray-400">Dificuldade Max</span>
            <span className="font-mono">Lvl {Math.floor(score/5) + 1}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cérebros Derrotados</span>
            <span className="font-mono text-cyan-400">1,402</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm grid grid-cols-1 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} /> TENTAR NOVAMENTE
        </motion.button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setGameState('LOBBY')}
            className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Home size={18} /> INÍCIO
          </button>
          <button className="py-4 bg-cyan-500 text-black rounded-2xl flex items-center justify-center gap-2 font-bold text-sm">
            <Share2 size={18} /> COMPARTILHAR
          </button>
        </div>
      </div>
    </div>
  );
};

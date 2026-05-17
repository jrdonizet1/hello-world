import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Users, Zap } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();

  return (
    <div className="flex flex-col items-center justify-between h-full p-8 pb-12">
      <div className="mt-12 text-center">
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500"
        >
          BRAINLAG
        </motion.h1>
        <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] mt-2">MULTIPLAYER NEURAL CHAOS</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
            <Users className="text-cyan-400 mb-2" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Jogadores</span>
            <span className="text-xl font-bold">1,204</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
            <Trophy className="text-yellow-400 mb-2" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Rank Global</span>
            <span className="text-xl font-bold">#42</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="w-full py-6 bg-white text-black font-black text-2xl rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-shadow"
        >
          INICIAR CAOS
        </motion.button>
        
        <p className="text-center text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          A COR BATE COM A PALAVRA? <br />
          DECIDA RÁPIDO: SIM OU NÃO.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <Zap size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Lobby } from './Lobby';
import { GameArena } from './GameArena';
import { GameOver } from './GameOver';

export const BrainLagGame: React.FC = () => {
  const { gameState, setGameState } = useGameStore();

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full"
          >
            <Lobby />
          </motion.div>
        )}

        {(gameState === 'PREPARE' || gameState === 'PLAYING') && (
          <motion.div
            key="game"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative z-10 w-full h-full"
          >
            <GameArena />
          </motion.div>
        )}

        {gameState === 'ELIMINATED' && (
          <motion.div
            key="gameover"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full"
          >
            <GameOver />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

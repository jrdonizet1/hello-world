import React, { useEffect, useState, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { generateCommand } from '../../lib/gameLogic';

export const GameArena: React.FC = () => {
  const { 
    gameState, 
    setGameState, 
    currentCommand, 
    setCommand, 
    score, 
    updateScore, 
    timeRemaining, 
    tick,
    endGame 
  } = useGameStore();

  const [countDown, setCountDown] = useState(3);
  const controls = useAnimation();

  // Handle countdown
  useEffect(() => {
    if (gameState === 'PREPARE') {
      const timer = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('PLAYING');
            setCommand(generateCommand(1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, setGameState, setCommand]);

  // Game loop tick
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const interval = setInterval(() => {
        tick(0.05);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [gameState, tick]);

  const handleAction = useCallback((action: string, target: string) => {
    if (gameState !== 'PLAYING' || !currentCommand) return;

    // Check if action matches command logic
    // Simplified for MVP:
    let success = false;
    
    if (currentCommand.type === 'COLOR') {
      if (currentCommand.action === 'tap' && target === currentCommand.target) success = true;
      if (currentCommand.action === 'not_tap' && target !== currentCommand.target) success = true;
    } else if (currentCommand.type === 'MATH') {
       if (target === currentCommand.target) success = true;
    } else if (currentCommand.type === 'TAP') {
       success = true;
    }

    if (success) {
      updateScore(1);
      setCommand(generateCommand(Math.floor(score / 5) + 1));
      // Reset timer slightly faster as score increases
      useGameStore.setState({ timeRemaining: Math.max(0.5, 3 - (score * 0.05)) });
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.1 }
      });
    } else {
      endGame('COMANDO ERRADO!');
    }
  }, [gameState, currentCommand, score, updateScore, setCommand, endGame, controls]);

  if (gameState === 'PREPARE') {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.span 
          key={countDown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-9xl font-black italic"
        >
          {countDown}
        </motion.span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Pontos</span>
          <span className="text-4xl font-black italic">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sobreviventes</span>
          <span className="text-2xl font-black text-cyan-400">12</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-12 border border-white/5">
        <motion.div 
          className="h-full bg-cyan-500"
          animate={{ width: `${(timeRemaining / 3) * 100}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      {/* Main Command Area */}
      <motion.div 
        animate={controls}
        className="flex-1 flex flex-col items-center justify-center text-center px-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCommand?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-none uppercase">
              {currentCommand?.text}
            </h2>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Interaction Area (Dynamic based on command) */}
      <div className="grid grid-cols-2 gap-4 h-64 mb-8">
        <InteractionButton color="bg-red-500" label="VERMELHO" onClick={() => handleAction('tap', 'red')} />
        <InteractionButton color="bg-blue-500" label="AZUL" onClick={() => handleAction('tap', 'blue')} />
        <InteractionButton color="bg-green-500" label="VERDE" onClick={() => handleAction('tap', 'green')} />
        <InteractionButton color="bg-yellow-500" label="AMARELO" onClick={() => handleAction('tap', 'yellow')} />
      </div>
    </div>
  );
};

const InteractionButton: React.FC<{ color: string; label: string; onClick: () => void }> = ({ color, label, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9, filter: 'brightness(1.5)' }}
    onClick={onClick}
    className={`${color} rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-b-8 border-black/20`}
  >
    {label}
  </motion.button>
);

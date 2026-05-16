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
  const [isWrong, setIsWrong] = useState(false);
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

    let success = false;
    
    if (currentCommand.type === 'COLOR') {
      if (currentCommand.action === 'tap' && target === currentCommand.target) success = true;
      if (currentCommand.action === 'not_tap' && target !== currentCommand.target) success = true;
    } else if (currentCommand.type === 'MATH' || currentCommand.type === 'TAP') {
       success = true;
    }

    if (success) {
      updateScore(1);
      setCommand(generateCommand(Math.floor(score / 5) + 1));
      const baseTime = Math.max(0.7, 2.2 - (score * 0.04));
      useGameStore.setState({ timeRemaining: baseTime });
      
      controls.start({
        scale: [1, 1.1, 1],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
        transition: { duration: 0.1 }
      });
    } else {
      setIsWrong(true);
      setTimeout(() => endGame('CONEXÃO CEREBRAL PERDIDA'), 200);
    }
  }, [gameState, currentCommand, score, updateScore, setCommand, endGame, controls]);

  if (gameState === 'PREPARE') {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.span 
          key={countDown}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="text-9xl font-black italic glitch-effect"
        >
          {countDown}
        </motion.span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full relative p-6 transition-colors duration-200 ${isWrong ? 'bg-red-900' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Sincronia</span>
          <span className="text-4xl font-black italic tabular-nums">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Estável</span>
          <span className="text-2xl font-black text-cyan-400 tabular-nums">98%</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-12 border border-white/10 p-[2px]">
        <motion.div 
          className={`h-full rounded-full ${timeRemaining < 0.8 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-cyan-500'}`}
          animate={{ width: `${Math.max(0, (timeRemaining / 2.2) * 100)}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      {/* Main Command Area */}
      <motion.div 
        animate={controls}
        className="flex-1 flex flex-col items-center justify-center text-center px-4 mb-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCommand?.id}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            className="space-y-2"
          >
            <h2 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none uppercase italic glitch-effect">
              {currentCommand?.text}
            </h2>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Interaction Area */}
      <div className="grid grid-cols-2 gap-3 h-[45%] mb-4">
        <InteractionButton color="bg-red-600" label="VERMELHO" onClick={() => handleAction('tap', 'red')} />
        <InteractionButton color="bg-blue-600" label="AZUL" onClick={() => handleAction('tap', 'blue')} />
        <InteractionButton color="bg-green-600" label="VERDE" onClick={() => handleAction('tap', 'green')} />
        <InteractionButton color="bg-yellow-500" label="AMARELO" onClick={() => handleAction('tap', 'yellow')} />
      </div>
    </div>
  );
};

const InteractionButton: React.FC<{ color: string; label: string; onClick: () => void }> = ({ color, label, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.94 }}
    onClick={onClick}
    className={`${color} rounded-3xl flex items-center justify-center font-black text-xl shadow-2xl border-b-[6px] border-black/30 active:border-b-0 active:translate-y-1 transition-all`}
  >
    <span className="drop-shadow-md">{label}</span>
  </motion.button>
);

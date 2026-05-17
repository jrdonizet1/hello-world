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
    endGame,
    userSkin,
    userTitle
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

  const handleAction = useCallback((response: boolean) => {
    if (gameState !== 'PLAYING' || !currentCommand) return;

    const isCorrect = (currentCommand as any).isCorrect === response;
    
    if (isCorrect) {
      updateScore(1);
      setCommand(generateCommand(Math.floor(score / 5) + 1));
      
      // Scalable difficulty: time starts at 2s and drops towards 0.6s
      const baseTime = Math.max(0.6, 2.0 - (score * 0.035));
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
          style={{ color: userSkin || '#06b6d4' }}
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
          <span 
            className="text-2xl font-black tabular-nums"
            style={{ color: userSkin || '#06b6d4' }}
          >
            98%
          </span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-12 border border-white/10 p-[2px]">
        <motion.div 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: timeRemaining < 0.8 ? '#ef4444' : (userSkin || '#06b6d4'),
            boxShadow: timeRemaining < 0.8 ? '0 0 15px rgba(239,68,68,0.5)' : `0 0 15px ${(userSkin || '#06b6d4')}80`
          }}
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
            className="flex flex-col items-center"
          >
            <h3 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest">
              {currentCommand?.text}
            </h3>
            
            {currentCommand?.type === 'COLOR' ? (
              <h2 
                className="text-7xl sm:text-8xl font-black tracking-tighter leading-none uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                style={{ color: (currentCommand as any)?.displayColor }}
              >
                {(currentCommand as any)?.displayWord}
              </h2>
            ) : (
              <h2 className="text-7xl sm:text-8xl font-black tracking-tighter leading-none uppercase italic glitch-effect">
                {(currentCommand as any)?.displayWord || currentCommand?.text}
              </h2>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Interaction Area */}
      <div className="flex gap-4 h-[25%] mb-8">
        <button 
          onClick={() => handleAction(false)}
          className="flex-1 rounded-3xl bg-red-500/10 border-2 border-red-500/50 flex flex-col items-center justify-center gap-2 active:scale-95 active:bg-red-500/20 transition-all text-red-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-12 h-12" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          <span className="font-bold tracking-widest text-sm">NÃO</span>
        </button>

        <button 
          onClick={() => handleAction(true)}
          className="flex-1 rounded-3xl bg-green-500/10 border-2 border-green-500/50 flex flex-col items-center justify-center gap-2 active:scale-95 active:bg-green-500/20 transition-all text-green-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-12 h-12" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
          <span className="font-bold tracking-widest text-sm">SIM</span>
        </button>
      </div>
    </div>
  );
};

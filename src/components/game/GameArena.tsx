import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Zap, Swords } from 'lucide-react';
import { generateCommand } from '../../lib/gameLogic';
import { saveGameHistory } from '@/lib/server-functions';
import { supabase } from '@/integrations/supabase/client';

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
    userTitle,
    userFont,
    userArenaEffect,
    gameMode,
    selectedThemes,
    baseTime,
    accelerationIntensity,
    increaseCombo,
    resetCombo,
    multiplier,
    combo,
    isMultiplayer,
    duelOpponentProgress,
    duelSeed,
    setDuelOpponent
  } = useGameStore();
  
  const [lastCommandTime, setLastCommandTime] = useState(Date.now());
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
            setCommand(generateCommand(1, selectedThemes, duelSeed || undefined));
            setLastCommandTime(Date.now());
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

  // Real-time Duel Logic
  const { roomId } = useGameStore();
  const lastSentScore = useRef(0);

  useEffect(() => {
    if (!isMultiplayer || !roomId || gameState !== 'PLAYING') return;

    const channel = supabase.channel(`duel-${roomId}`);
    
    channel
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        if (payload.userId !== supabase.auth.getUser()) { // Basic check
          setDuelOpponent(payload.userId, payload.score);
        }
      })
      .on('broadcast', { event: 'player_eliminated' }, ({ payload }) => {
        // If opponent is eliminated, we could show a message or just continue
        console.log('Opponent eliminated:', payload.userId);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [isMultiplayer, roomId, gameState]);

  // Sync score with opponent
  useEffect(() => {
    if (isMultiplayer && roomId && score !== lastSentScore.current) {
      lastSentScore.current = score;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const channel = supabase.channel(`duel-${roomId}`);
        channel.send({
          type: 'broadcast',
          event: 'score_update',
          payload: { score, userId: user.id }
        });
      });
    }
  }, [score, isMultiplayer, roomId]);

  const handleAction = useCallback((response: boolean) => {
    if (gameState !== 'PLAYING' || !currentCommand) return;

    const isCorrect = (currentCommand as any).isCorrect === response;
    const reactionTime = (Date.now() - lastCommandTime) / 1000;
    
    // Save history
    saveGameHistory({
      data: {
        commandText: currentCommand.text,
        displayWord: (currentCommand as any).displayWord || null,
        isCorrect: (currentCommand as any).isCorrect,
        userAnswer: response,
        theme: currentCommand.theme || 'GENERAL'
      }
    } as any).catch(err => console.error('Error saving history:', err));

    if (isCorrect) {
      increaseCombo(reactionTime);
      updateScore(1);
      const nextScore = score + 1;
      setCommand(generateCommand(Math.floor(nextScore / 5) + 1, selectedThemes, duelSeed ? duelSeed + nextScore : undefined));
      setLastCommandTime(Date.now());
      
      // Scalable difficulty logic based on GameMode and Acceleration Intensity
      let nextTime = baseTime;
      
      // Complexity bonus (extra time for harder themes)
      let complexityBonus = 0;
      if (currentCommand.theme === 'MATH') complexityBonus = 0.4;
      if (currentCommand.theme === 'CAPITAL') complexityBonus = 0.5;
      if (currentCommand.theme === 'SEQUENCE') complexityBonus = 0.3;
      if (currentCommand.theme === 'SCALE') complexityBonus = 0.3;
      
      const getShrinkFactor = () => {
        if (accelerationIntensity === 'OFF') return 0;
        if (accelerationIntensity === 'SLOW') return 0.015;
        if (accelerationIntensity === 'NORMAL') return 0.035;
        if (accelerationIntensity === 'INSANE') return 0.06;
        return 0.035;
      };

      const shrinkFactor = getShrinkFactor();

      if (gameMode === 'BLITZ') {
        const shrink = score * shrinkFactor * 0.5;
        nextTime = Math.max(0.4, 1.2 - shrink);
      } else if (gameMode === 'SURVIVAL') {
        const shrink = score * shrinkFactor * 0.3;
        const bonus = Math.max(0.2, 0.8 - shrink) + complexityBonus;
        nextTime = Math.min(5, timeRemaining + bonus);
      } else {
        const shrink = score * shrinkFactor;
        nextTime = Math.max(0.5, baseTime - shrink) + complexityBonus;
      }
      
      useGameStore.setState({ timeRemaining: nextTime });
      
      controls.start({
        scale: [1, 1.1, 1],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
        transition: { duration: 0.1 }
      });
    } else {
      setIsWrong(true);
      setTimeout(() => endGame('CONEXÃO CEREBRAL PERDIDA'), 200);
    }
  }, [gameState, currentCommand, score, updateScore, setCommand, endGame, controls, gameMode, timeRemaining, lastCommandTime, increaseCombo]);

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
    <div className={`flex flex-col h-full relative p-6 transition-colors duration-200 overflow-hidden ${isWrong ? 'bg-red-900' : ''}`}>
      {/* Arena Effects Background */}
      {userArenaEffect && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {userArenaEffect.type === 'grid' && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{ 
                backgroundImage: `linear-gradient(${userArenaEffect.color}33 1px, transparent 1px), linear-gradient(90deg, ${userArenaEffect.color}33 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg) translateY(0%)',
                animation: 'grid-move 2s linear infinite'
              }}
            />
          )}
          {userArenaEffect.type === 'binary' && (
            <div className="absolute inset-0 opacity-10 font-mono text-[10px] flex justify-around select-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-fall" style={{ animationDelay: `${i * 0.5}s`, color: userArenaEffect.color }}>
                  {Array.from({ length: 20 }).map((_, j) => (
                    <div key={j}>{Math.round(Math.random())}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes grid-move {
          from { transform: perspective(500px) rotateX(60deg) translateY(0); }
          to { transform: perspective(500px) rotateX(60deg) translateY(40px); }
        }
        @keyframes fall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .animate-fall {
          animation: fall 10s linear infinite;
        }
      `}</style>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        {/* Opponent Progress (Multiplayer Duel) */}
        {isMultiplayer && (
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              animate={{ width: `${Math.min(100, (duelOpponentProgress / 50) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute top-2 left-2 text-[8px] font-black text-red-500 uppercase tracking-widest opacity-60">
              Oponente: {duelOpponentProgress} pts
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Sincronia</span>
          <span className="text-4xl font-black italic tabular-nums">{score.toFixed(1)}</span>
          {userTitle && (
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">
              {userTitle}
            </span>
          )}
        </div>
        
        {/* Combo Multiplier */}
        <div className="flex-1 flex flex-col items-center">
          <AnimatePresence>
            {combo > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="flex flex-col items-center"
              >
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Combo x{combo}</span>
                <div className="bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Zap size={12} className="text-cyan-400 fill-cyan-400" />
                  <span className="text-lg font-black italic text-cyan-400 leading-none">x{multiplier.toFixed(1)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-12 border border-white/10 p-[2px] z-10">
        <motion.div 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: timeRemaining < 0.8 ? '#ef4444' : (userSkin || '#06b6d4'),
            boxShadow: timeRemaining < 0.8 ? '0 0 15px rgba(239,68,68,0.5)' : `0 0 15px ${(userSkin || '#06b6d4')}80`
          }}
          animate={{ width: `${Math.max(0, (timeRemaining / (gameMode === 'SURVIVAL' ? 5 : (gameMode === 'BLITZ' ? 1.2 : baseTime + 0.5))) * 100)}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      {/* Main Command Area */}
      <motion.div 
        animate={controls}
        className="flex-1 flex flex-col items-center justify-center text-center px-4 mb-8 z-10"
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
                style={{ 
                  color: (currentCommand as any)?.displayColor,
                  fontFamily: userFont?.fontFamily || 'inherit',
                  fontSize: userFont?.size ? `calc(5rem * ${userFont.size.replace('em','')})` : 'inherit'
                }}
              >
                {(currentCommand as any)?.displayWord}
              </h2>
            ) : (
              <h2 
                className={`font-black tracking-tighter leading-none uppercase italic glitch-effect ${
                  ((currentCommand as any)?.displayWord || currentCommand?.text || '').length > 20 
                    ? 'text-3xl sm:text-4xl' 
                    : ((currentCommand as any)?.displayWord || currentCommand?.text || '').length > 10
                      ? 'text-5xl sm:text-6xl'
                      : 'text-7xl sm:text-8xl'
                }`}
                style={{
                  fontFamily: userFont?.fontFamily || 'inherit',
                }}
              >
                {(currentCommand as any)?.displayWord || currentCommand?.text}
              </h2>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Interaction Area */}
      <div className="flex gap-4 h-[25%] mb-8 z-10">
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

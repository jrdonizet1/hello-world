import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { RefreshCw, Share2, Home, User, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { saveScore, getLeaderboard } from '@/lib/server-functions';
import { toast } from 'sonner';

export const GameOver: React.FC = () => {
  const { score, lastError, startGame, setGameState } = useGameStore();
  const [session, setSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<{ xp: number; coins: number; leveledUp: boolean; newLevel: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchLeaderboard();

    return () => subscription.unsubscribe();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const handleSaveScore = async () => {
    if (!session) {
      toast.error('Faça login para salvar seu score!');
      return;
    }
    setLoading(true);
    try {
      const result = await (saveScore as any)({ data: { score } });
      if (result.success) {
        setRewards({
          xp: result.xpGained,
          coins: result.coinsGained,
          leveledUp: result.leveledUp,
          newLevel: result.newLevel
        });
        toast.success('Ganhos processados!');
      }
      fetchLeaderboard();
    } catch (err: any) {
      toast.error('Erro ao salvar score: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google');
    if (error) toast.error('Erro ao fazer login com Google');
  };

  useEffect(() => {
    if (score > 10) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2ff', '#ffffff', '#ff0055']
      });
    }
    
    // Auto-save score if logged in
    if (session && score > 0) {
      handleSaveScore();
    }
  }, [score, session]);

  return (
    <div className="flex flex-col items-center justify-start h-full p-6 pt-12 bg-red-950/20 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2 mb-8"
      >
        <h1 className="text-5xl font-black text-red-500 italic">BRAIN LAG</h1>
        <p className="text-sm font-bold text-white/60 uppercase tracking-tighter">{lastError || 'FIM DE JOGO'}</p>
      </motion.div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 backdrop-blur-xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-gray-500 text-[10px] font-bold uppercase">Pontuação Final</p>
            <p className="text-5xl font-black italic">{score}</p>
          </div>
          <div className="text-right">
            {!session ? (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors"
              >
                <LogIn size={14} /> Salvar Score
              </button>
            ) : (
              <p className="text-cyan-400 text-xs font-black uppercase">Ranking Global</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">Top Mundial</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-black w-4 ${i < 3 ? 'text-cyan-400' : 'text-gray-500'}`}>{i + 1}</span>
                    <span className="font-bold truncate max-w-[120px]">
                      {entry.profiles?.nickname || 'Cérebro Anônimo'}
                    </span>
                  </div>
                  <span className="font-black italic text-cyan-400">{entry.score}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-500 italic">Carregando ranking...</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm grid grid-cols-1 gap-4 pb-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <RefreshCw size={20} /> JOGAR NOVAMENTE
        </motion.button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setGameState('LOBBY')}
            className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Home size={18} /> INÍCIO
          </button>
          <button className="py-4 bg-cyan-500 text-black rounded-2xl flex items-center justify-center gap-2 font-bold text-sm">
            <Share2 size={18} /> DESAFIAR
          </button>
        </div>
      </div>
    </div>
  );
};

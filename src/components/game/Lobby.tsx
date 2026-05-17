import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Users, Zap, LogIn, User, LogOut } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateProfile } from '@/lib/server-functions';

export const Lobby: React.FC = () => {
  const { startGame } = useGameStore();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('nickname').eq('id', userId).single();
    if (data?.nickname) setNickname(data.nickname);
  };

  const handleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google');
    if (error) toast.error('Erro ao conectar com Google');
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    try {
      await updateProfile({ data: { nickname } });
      setIsEditing(false);
      toast.success('Perfil atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full p-8 pb-12 overflow-y-auto">
      <div className="mt-8 text-center">
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500"
        >
          BRAINLAG
        </motion.h1>
        <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] mt-2">MULTIPLAYER NEURAL CHAOS</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Profile / Auth Section */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          {!session ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest text-center">
                CONECTE PARA RANKING GLOBAL
              </p>
              <button 
                onClick={handleLogin}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all"
              >
                <Zap size={16} className="text-cyan-400" /> ENTRAR COM GOOGLE
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                    <User size={16} className="text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/40 uppercase">Agente Neural</span>
                    <span className="text-sm font-black truncate max-w-[120px]">
                      {nickname || 'Cérebro Anônimo'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-white/40 hover:text-red-500 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <input 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Seu Nickname..."
                    className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-cyan-500/50"
                  />
                  <button 
                    onClick={handleSaveNickname}
                    className="px-4 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase"
                  >
                    SALVAR
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase hover:bg-white/10 transition-all"
                >
                  EDITAR PERFIL
                </button>
              )}
            </div>
          )}
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
          <Trophy size={20} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
};
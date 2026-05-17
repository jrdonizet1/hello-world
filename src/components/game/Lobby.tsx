import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Users, Zap, LogIn, User, LogOut, Plus, LogIn as JoinIcon, ChevronLeft } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateProfile, createRoom, joinRoom, startRoomGame } from '@/lib/server-functions';

export const Lobby: React.FC = () => {
  const { startGame, setRoom, roomId, roomCode, isHost } = useGameStore();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<'MAIN' | 'MULTIPLAYER' | 'WAITING'>('MAIN');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Real-time subscriptions for Multiplayer
  useEffect(() => {
    if (!roomId) return;

    // Fetch initial players
    fetchPlayers();

    // Subscribe to room changes (for game start)
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'rooms',
        filter: `id=eq.${roomId}` 
      }, (payload) => {
        if (payload.new.status === 'STARTING') {
          startGame();
        }
      })
      .subscribe();

    // Subscribe to profile changes (for player list)
    const profilesChannel = supabase
      .channel(`profiles-${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `room_id=eq.${roomId}` 
      }, () => {
        fetchPlayers();
      })
      .subscribe();

    return () => {
      roomChannel.unsubscribe();
      profilesChannel.unsubscribe();
    };
  }, [roomId]);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('room_id', roomId);
    if (data) setPlayers(data);
  };

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
      await (updateProfile as any)({ data: { nickname } });
      setIsEditing(false);
      toast.success('Perfil atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleCreateRoom = async () => {
    if (!session) return toast.error('Faça login para criar sala');
    setLoading(true);
    try {
      const room = await createRoom();
      setRoom(room.id, room.code, true);
      setView('WAITING');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!session) return toast.error('Faça login para entrar');
    if (!joinCode) return toast.error('Digite o código');
    setLoading(true);
    try {
      const room = await joinRoom({ data: joinCode });
      setRoom(room.id, room.code, false);
      setView('WAITING');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      await startRoomGame({ data: roomId });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLeaveRoom = async () => {
    await (updateProfile as any)({ data: { roomId: null } });
    setRoom(null, null, false);
    setView('MULTIPLAYER');
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
        <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] mt-2 uppercase">Neural Chaos</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <AnimatePresence mode="wait">
          {view === 'MAIN' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Profile Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
                {!session ? (
                  <button 
                    onClick={handleLogin}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all"
                  >
                    <Zap size={16} className="text-cyan-400" /> ENTRAR COM GOOGLE
                  </button>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <User size={20} className="text-cyan-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/40 uppercase">Status Online</span>
                        <span className="text-sm font-black truncate max-w-[120px]">
                          {nickname || 'Cérebro Anônimo'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-white/20 hover:text-red-500"><LogOut size={18} /></button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={startGame}
                  className="w-full py-6 bg-white text-black font-black text-2xl rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  SOLO RUN
                </button>
                <button 
                  onClick={() => setView('MULTIPLAYER')}
                  className="w-full py-4 bg-cyan-500/10 border-2 border-cyan-500/50 text-cyan-500 font-black text-lg rounded-2xl flex items-center justify-center gap-2"
                >
                  <Users size={20} /> ARENA MULTIPLAYER
                </button>
              </div>
            </motion.div>
          )}

          {view === 'MULTIPLAYER' && (
            <motion.div 
              key="multi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-white/40 font-bold text-xs uppercase tracking-widest mb-2">
                <ChevronLeft size={16} /> Voltar
              </button>

              <div className="space-y-3">
                <button 
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full py-5 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-all"
                >
                  <Plus className="text-cyan-400" />
                  <span className="font-black text-xs uppercase">Criar Nova Sala</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <JoinIcon size={18} className="text-white/20" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="CÓDIGO DA SALA"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-5 px-12 font-black text-center tracking-[0.5em] outline-none focus:border-cyan-500/50"
                  />
                </div>
                
                <button 
                  onClick={handleJoinRoom}
                  disabled={loading}
                  className="w-full py-4 bg-cyan-500 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  ENTRAR NA ARENA
                </button>
              </div>
            </motion.div>
          )}

          {view === 'WAITING' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Arena Conectada</span>
                <h2 className="text-5xl font-black italic tracking-widest mt-1">{roomCode}</h2>
                <p className="text-white/40 text-[10px] mt-2 font-bold uppercase">Compartilhe o código com seus amigos</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black uppercase text-white/40 tracking-widest">Jogadores ({players.length})</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/40"></div>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {players.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      {p.nickname || 'Cérebro Conectando...'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {isHost ? (
                  <button 
                    onClick={handleStartGame}
                    className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  >
                    INICIAR PARTIDA
                  </button>
                ) : (
                  <div className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-black text-xs text-white/40 uppercase tracking-widest">Aguardando Host...</span>
                  </div>
                )}
                <button onClick={handleLeaveRoom} className="w-full py-3 text-red-500/50 font-black text-[10px] uppercase tracking-widest">Sair da Sala</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
        {view === 'MAIN' ? 'Ready to Sync' : 'Lobby Sincronizado'}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Users, Zap, LogIn, User, LogOut, Plus, LogIn as JoinIcon, ChevronLeft, Copy, Check, Shield, ShieldOff, Lock, UserPlus, RefreshCw } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateProfile, createRoom, joinRoom, startRoomGame, claimDailyReward, leaveRoom } from '@/lib/server-functions';

type LobbyView = 'MAIN' | 'MULTIPLAYER' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'WAITING' | 'VISITOR_NICK' | 'ROOMS_LIST' | 'PROFILE';

export const Lobby: React.FC = () => {
  const { startGame, setRoom, roomId, roomCode, isHost } = useGameStore();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<LobbyView>('MAIN');
  const [loading, setLoading] = useState(false);
  
  // Create Room State
  const [roomName, setRoomName] = useState('Arena Neural');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  
  // Join Room State
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  // Room List State
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  // Room Lobby State
  const [players, setPlayers] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'CREATE' | 'JOIN', code?: string } | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);

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

  useEffect(() => {
    if (view === 'ROOMS_LIST') {
      fetchAvailableRooms();
    }
  }, [view]);

  const fetchAvailableRooms = async () => {
    setLoading(true);
    try {
      // Get rooms with their player counts
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select(`
          *,
          profiles:profiles(count)
        `)
        .eq('status', 'LOBBY')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedRooms = rooms.map(room => ({
        ...room,
        playerCount: room.profiles[0]?.count || 0
      }));

      setAvailableRooms(formattedRooms);
    } catch (err: any) {
      toast.error('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    fetchPlayers();
    fetchRoomDetails();

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
      .select('id, nickname, is_ready')
      .eq('room_id', roomId as string);
    if (data) setPlayers(data);
  };

  const fetchRoomDetails = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId as string)
      .single();
    if (data) setRoomData(data);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      if (data.nickname) setNickname(data.nickname);
    }
  };

  const handleVisitorLogin = async () => {
    if (!nickname.trim()) return toast.error('Digite seu nick');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      await (updateProfile as any)({ data: { nickname } });
      
      if (pendingAction?.type === 'CREATE') {
        handleCreateRoom();
      } else if (pendingAction?.type === 'JOIN') {
        handleJoinRoom(pendingAction.code);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!session) {
      setPendingAction({ type: 'CREATE' });
      setView('VISITOR_NICK');
      return;
    }
    setLoading(true);
    try {
      const room = await (createRoom as any)({ 
        data: { name: roomName, maxPlayers, isPrivate, password } 
      });
      setRoom(room.id, room.code, true);
      setView('WAITING');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (codeOverride?: string) => {
    const code = codeOverride || joinCode;
    if (!session) {
      setPendingAction({ type: 'JOIN', code });
      setView('VISITOR_NICK');
      return;
    }
    if (!code) return toast.error('Digite o código');
    
    setLoading(true);
    try {
      const room = await (joinRoom as any)({ 
        data: { code, password: joinPassword } 
      });
      setRoom(room.id, room.code, false);
      setView('WAITING');
    } catch (err: any) {
      if (err.message === 'Senha incorreta') {
        setNeedsPassword(true);
        toast.error('Esta sala é privada. Digite a senha.');
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    try {
      await (updateProfile as any)({ data: { isReady: newReady } });
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleStartGame = async () => {
    const allReady = players.every(p => p.is_ready || p.id === session?.user?.id);
    if (!allReady) {
      toast.error('Aguardando todos ficarem prontos');
      return;
    }
    try {
      await (startRoomGame as any)({ data: roomId });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLeaveRoom = async () => {
    setLoading(true);
    try {
      await (leaveRoom as any)();
      setRoom(null, null, false);
      setIsReady(false);
      setView('MULTIPLAYER');
    } catch (err: any) {
      toast.error('Erro ao sair da sala');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success('Código copiado!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full p-8 pb-12 overflow-y-auto">
      <div className="mt-4 text-center">
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500"
        >
          BRAINLAG
        </motion.h1>
        <p className="text-cyan-400 font-mono text-[10px] tracking-[0.4em] mt-1 uppercase opacity-80">Neural Multi-Chaos</p>
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
              <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl backdrop-blur-xl space-y-3">
                {!session ? (
                  <>
                    <button 
                      onClick={() => setView('MULTIPLAYER')}
                      className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all"
                    >
                      <UserPlus size={16} className="text-cyan-400" /> JOGAR COMO VISITANTE
                    </button>
                    <button 
                      onClick={async () => {
                        const { error } = await lovable.auth.signInWithOAuth('google');
                        if (error) toast.error('Erro ao conectar com Google');
                      }}
                      className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all text-cyan-500"
                    >
                      <Zap size={16} /> ENTRAR COM GOOGLE
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => setView('PROFILE')}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-110 transition-transform">
                        <User size={20} className="text-cyan-400" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black truncate max-w-[120px] text-white group-hover:text-cyan-400 transition-colors">
                            {nickname || 'Cérebro Anônimo'}
                          </span>
                          <span className="bg-cyan-500/20 text-cyan-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-cyan-500/20">LVL {profile?.level || 1}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                            <span className="text-[10px] font-black text-yellow-500">{profile?.coins || 0}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">XP {profile?.xp || 0}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-zinc-600 hover:text-red-500 transition-colors ml-4"><LogOut size={18} /></button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={startGame}
                  className="w-full py-6 bg-white text-black font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-transform"
                >
                  SOLO RUN
                </button>
                <button 
                  onClick={() => setView('MULTIPLAYER')}
                  className="w-full py-5 bg-cyan-500/5 border-2 border-cyan-500/30 text-cyan-500 font-black text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-500/10 active:scale-95 transition-all"
                >
                  <Users size={20} /> ARENA MULTIPLAYER
                </button>
                
                {session && (
                  <button 
                    disabled={rewardLoading}
                    onClick={async () => {
                      setRewardLoading(true);
                      try {
                        const result = await (claimDailyReward as any)();
                        toast.success(`Você resgatou ${result.reward} Brain Coins!`);
                        fetchProfile(session.user.id);
                      } catch (err: any) {
                        toast.error(err.message);
                      } finally {
                        setRewardLoading(false);
                      }
                    }}
                    className="w-full py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                  >
                    {rewardLoading ? (
                      <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Trophy size={14} /> Resgatar Recompensa Diária
                      </>
                    )}
                  </button>
                )}
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
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar
              </button>

              <div className="space-y-4">
                <button 
                  onClick={() => setView('CREATE_ROOM')}
                  className="w-full py-8 bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                >
                  <div className="p-3 rounded-full bg-zinc-800 group-hover:bg-cyan-500/20 transition-colors">
                    <Plus className="text-zinc-500 group-hover:text-cyan-400" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white">Criar Nova Arena</span>
                </button>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <JoinIcon size={18} className="text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="CÓDIGO DA SALA"
                    value={joinCode}
                    maxLength={4}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900/80 border-2 border-zinc-800 rounded-2xl py-5 px-14 font-black text-center tracking-[0.6em] outline-none focus:border-cyan-500/50 text-white placeholder:text-zinc-700"
                  />
                </div>

                {needsPassword && (
                   <input 
                    type="password" 
                    placeholder="SENHA DA SALA"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full bg-zinc-900/80 border-2 border-zinc-800 rounded-2xl py-4 px-6 font-bold text-center outline-none focus:border-red-500/50 text-white placeholder:text-zinc-700"
                  />
                )}
                
                <button 
                  onClick={() => handleJoinRoom()}
                  disabled={loading}
                  className="w-full py-5 bg-cyan-500 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'ENTRAR NA ARENA'}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ou</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>

                <button 
                  onClick={() => setView('ROOMS_LIST')}
                  className="w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
                >
                  <RefreshCw size={14} className="text-cyan-500" /> VER SALAS DISPONÍVEIS
                </button>
              </div>
            </motion.div>
          )}

          {view === 'ROOMS_LIST' && (
            <motion.div 
              key="rooms-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col w-full max-w-sm h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase">Salas</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">{availableRooms.length} sala(s) disponíveis</p>
                </div>
                <button 
                  onClick={fetchAvailableRooms}
                  disabled={loading}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pb-4 max-h-[400px] pr-2 custom-scrollbar">
                {availableRooms.length === 0 && !loading ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Nenhuma arena ativa</p>
                    <button onClick={() => setView('CREATE_ROOM')} className="text-cyan-500 text-[10px] font-black underline">CRIAR A PRIMEIRA</button>
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <div key={room.id} className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {room.is_private && <Lock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                            <span className="text-white font-black truncate">{room.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-zinc-500 text-xs">{room.code}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="text-zinc-400 text-xs font-bold">{room.playerCount}/{room.max_players} jogadores</span>
                            {room.is_private && (
                              <span className="text-yellow-600 text-[10px] font-bold uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full">Privada</span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setJoinCode(room.code);
                            if (room.is_private) {
                              setNeedsPassword(true);
                              setView('MULTIPLAYER');
                              toast.info('Digite a senha para entrar');
                            } else {
                              handleJoinRoom(room.code);
                            }
                          }}
                          className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-all"
                        >
                          Entrar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setView('MULTIPLAYER')}
                className="text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest text-sm mt-4 text-center"
              >
                Voltar
              </button>
            </motion.div>
          )}

          {view === 'CREATE_ROOM' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <button onClick={() => setView('MULTIPLAYER')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Cancelar
              </button>

              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Sala</label>
                  <input 
                    type="text" 
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 font-bold outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Máximo de Jogadores ({maxPlayers})</label>
                  <input 
                    type="range" 
                    min="2" 
                    max="8" 
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    {isPrivate ? <Shield className="text-red-500" size={18} /> : <ShieldOff className="text-zinc-600" size={18} />}
                    <span className="text-xs font-bold uppercase tracking-widest">Sala Privada</span>
                  </div>
                  <button 
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-red-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {isPrivate && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <input 
                      type="password" 
                      placeholder="Mínimo 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 font-bold outline-none focus:border-red-500/50"
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'GERAR ARENA'}
              </button>
            </motion.div>
          )}

          {view === 'VISITOR_NICK' && (
            <motion.div 
              key="visitor"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Identificação Neural</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Como você será conhecido na arena?</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="SEU NICKNAME"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl py-5 px-6 font-black text-center text-xl outline-none focus:border-cyan-500/50 text-white placeholder:text-zinc-800"
                />
                <button 
                  onClick={handleVisitorLogin}
                  disabled={loading}
                  className="w-full py-5 bg-cyan-500 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'CONECTAR AO SISTEMA'}
                </button>
                <button 
                  onClick={() => setView('MULTIPLAYER')}
                  className="w-full py-2 text-zinc-600 font-bold text-[10px] uppercase tracking-widest"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {view === 'WAITING' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* User requested structure */}
              <div className="w-full text-center space-y-3 mb-2">
                <h2 className="text-[10px] font-black tracking-[0.3em] text-cyan-500/80 uppercase">
                  {roomData?.is_private ? 'Sala Privada' : roomData?.name || 'Arena Neural'}
                </h2>
                <div className="relative overflow-hidden group">
                  <div className="absolute inset-0 bg-cyan-500/5 blur-xl transition-all duration-500 group-hover:bg-cyan-500/10"></div>
                  <div className="flex items-center justify-between text-4xl font-black text-white tracking-widest bg-zinc-900/80 py-4 px-6 rounded-2xl border border-zinc-800 relative shadow-inner">
                    {roomCode}
                    <button 
                      onClick={copyCode}
                      className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-xl transition-colors active:scale-95"
                    >
                      <Copy className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 min-h-[220px] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Jogadores na Sala</h3>
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-2 py-1 rounded-full">
                    {players.length}/{roomData?.max_players || 4}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {players.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/80 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${p.is_ready || p.id === roomData?.host_id ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {p.is_ready && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>}
                        </div>
                        <span className="font-bold text-white tracking-wide text-xs">{p.nickname || 'Anônimo'}</span>
                        {p.id === session?.user?.id && (
                          <span className="text-[8px] uppercase tracking-widest text-cyan-500 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Você</span>
                        )}
                        {p.id === roomData?.host_id && (
                          <span className="text-[8px] uppercase tracking-widest text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Dono</span>
                        )}
                      </div>
                      {p.is_ready && <Check size={14} className="text-green-500" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full space-y-3 pt-2">
                {!isHost && (
                  <button 
                    onClick={handleToggleReady}
                    className={`w-full h-12 text-white text-sm font-black rounded-xl active:scale-95 transition-all ${isReady ? 'bg-zinc-800 border border-zinc-700' : 'bg-green-500 hover:bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}
                  >
                    {isReady ? 'CANCELAR PRONTO' : 'ESTOU PRONTO'}
                  </button>
                )}

                {isHost ? (
                  <button 
                    onClick={handleStartGame}
                    className="w-full h-16 bg-white text-black text-lg font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
                  >
                    <Zap className="w-6 h-6 fill-current" /> INICIAR CAOS
                  </button>
                ) : (
                  <button disabled className="w-full h-16 bg-zinc-800 text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-black rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed">
                    <Users className="w-5 h-5 opacity-50" /> AGUARDANDO JOGADORES...
                  </button>
                )}

                <button 
                  onClick={handleLeaveRoom}
                  className="w-full h-12 bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl active:scale-95 transition-all"
                >
                  Sair da Sala
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-zinc-800 text-[8px] font-black uppercase tracking-[0.5em] mt-8">
        Neural Sync Protocol v2.0
      </div>
    </div>
  );
};
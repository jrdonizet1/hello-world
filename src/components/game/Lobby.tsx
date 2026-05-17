import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Users, Zap, LogIn, User, LogOut, Plus, LogIn as JoinIcon, ChevronLeft, ChevronRight, Copy, Check, Shield, ShieldOff, Lock, UserPlus, RefreshCw, ShoppingBag, Share2, Timer, Infinity, Monitor, Globe, History, XCircle, CheckCircle2, ZapOff, Target } from 'lucide-react';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { updateProfile, createRoom, joinRoom, startRoomGame, claimDailyReward, leaveRoom, getProfile, redeemReferralCode, updateRoomSettings, getGameHistory, getLeaderboard } from '@/lib/server-functions';
import { Shop } from './Shop';
import { Missions } from './Missions';

type LobbyView = 'MAIN' | 'MULTIPLAYER' | 'CREATE_ROOM' | 'JOIN_ROOM' | 'WAITING' | 'VISITOR_NICK' | 'ROOMS_LIST' | 'PROFILE' | 'SHOP' | 'REFERRAL' | 'OFFLINE_SETTINGS' | 'HISTORY' | 'RANKING' | 'MISSIONS';

export const Lobby: React.FC = () => {
  const { startGame, setRoom, roomId, roomCode, isHost, setCustomization, selectedThemes, setSelectedThemes } = useGameStore();
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
  const [onlineCount, setOnlineCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [baseTime, setBaseTime] = useState(2.2);
  const [accelerationIntensity, setAccelerationIntensity] = useState<'OFF' | 'SLOW' | 'NORMAL' | 'INSANE'>('NORMAL');
  const [history, setHistory] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankingCategory, setRankingCategory] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rewardTimeRemaining = useMemo(() => {
    if (!profile?.last_daily_reward) return 0;
    const lastReward = new Date(profile.last_daily_reward).getTime();
    const waitTime = 24 * 60 * 60 * 1000;
    const remaining = lastReward + waitTime - currentTime;
    return Math.max(0, remaining);
  }, [profile?.last_daily_reward, currentTime]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };
  
  const isRewardAvailable = () => rewardTimeRemaining === 0;

  useEffect(() => {
    const fetchOnlineCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('room_id', 'is', null);
      setOnlineCount(count || 0);
    };
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('pending_referral', ref);
    }

    const joinParam = params.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
      setPendingAction({ type: 'JOIN', code: joinParam.toUpperCase() });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkPendingReferral(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        checkPendingReferral(session.user.id);
      } else {
        setProfile(null);
        setNickname('');
      }
    });

    // Cleanup for room
    const handleUnload = () => {
      if (roomId) {
        leaveRoom();
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [roomId]);

  const checkPendingReferral = async (userId: string) => {
    const pendingRef = localStorage.getItem('pending_referral');
    if (pendingRef && session && !session.user.is_anonymous) {
      try {
        const result = await (redeemReferralCode as any)({ data: pendingRef });
        if (result.success) {
          toast.success(result.message);
          localStorage.removeItem('pending_referral');
          fetchProfile(userId);
        }
      } catch (err: any) {
        // Only log if it's not the "already redeemed" error to avoid spamming
        if (!err.message.includes('já resgatou')) {
          console.error('Referral error:', err.message);
        }
        localStorage.removeItem('pending_referral');
      }
    }
  };

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
      
      const formattedRooms = rooms
        .map(room => ({
          ...room,
          playerCount: (room.profiles as any)?.[0]?.count || 0
        }))
        .filter(room => room.playerCount > 0);

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
          setCustomization(profile?.selected_skin, profile?.selected_title, profile?.selected_font, profile?.selected_arena_effect);
          startGame(
            undefined, 
            payload.new.selected_themes, 
            payload.new.base_time ? Number(payload.new.base_time) : undefined, 
            payload.new.acceleration_intensity || (payload.new.acceleration_enabled ? 'NORMAL' : 'OFF')
          );
        }
        if (!isHost) {
          if (payload.new.selected_themes) setSelectedThemes(payload.new.selected_themes);
          if (payload.new.base_time) setBaseTime(Number(payload.new.base_time));
          if (payload.new.acceleration_intensity) setAccelerationIntensity(payload.new.acceleration_intensity);
          else if (payload.new.acceleration_enabled !== undefined) setAccelerationIntensity(payload.new.acceleration_enabled ? 'NORMAL' : 'OFF');
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
      .select('id, nickname, is_ready, selected_skin, selected_title')
      .eq('room_id', roomId as string);
    if (data) setPlayers(data);
  };

  const fetchRoomDetails = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId as string)
      .single();
    if (data) {
      setRoomData(data);
      if (data.selected_themes) {
        setSelectedThemes(data.selected_themes);
      }
      if (data.base_time) setBaseTime(Number(data.base_time));
      if (data.acceleration_intensity) setAccelerationIntensity(data.acceleration_intensity as any);
      else if (data.acceleration_enabled !== null) setAccelerationIntensity(data.acceleration_enabled ? 'NORMAL' : 'OFF');
    }
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
      if (roomId) await (leaveRoom as any)();
      const room = await (createRoom as any)({ 
        data: { name: roomName, maxPlayers, isPrivate, password, selectedThemes, baseTime, accelerationIntensity } 
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
      if (roomId) await (leaveRoom as any)();
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
      setCustomization(profile?.selected_skin, profile?.selected_title, profile?.selected_font, profile?.selected_arena_effect);
      await (startRoomGame as any)({ data: roomId });
      // The room status will change to STARTING, and the subscription will call startGame()
      // But we need to make sure startGame uses the room's baseTime and acceleration
      startGame(undefined, selectedThemes, baseTime, accelerationIntensity);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLeaveRoom = async () => {
    setLoading(true);
    try {
      await (leaveRoom as any)();
    } catch (err: any) {
      console.error('Erro ao sair da sala:', err);
    } finally {
      setRoom(null, null, false);
      setIsReady(false);
      setView('MULTIPLAYER');
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      toast.success('Código copiado!');
    }
  };

  const THEMES = [
    { id: 'COLOR', name: 'Cores', icon: '🎨', color: 'text-pink-500' },
    { id: 'MATH', name: 'Matemática', icon: '🔢', color: 'text-blue-500' },
    { id: 'GENERAL', name: 'Gerais', icon: '🌍', color: 'text-green-500' },
    { id: 'CURIOSITY', name: 'Curiosidades', icon: '💡', color: 'text-yellow-500' },
    { id: 'SEQUENCE', name: 'Padrões', icon: '🧩', color: 'text-purple-500' },
    { id: 'CAPITAL', name: 'Capitais', icon: '🗺️', color: 'text-orange-500' },
    { id: 'SCALE', name: 'Tamanhos', icon: '⚖️', color: 'text-cyan-500' },
  ];

  const toggleTheme = async (themeId: string) => {
    let newThemes: string[];
    if (selectedThemes.includes(themeId)) {
      if (selectedThemes.length === 1) return toast.error('Selecione pelo menos um tema!');
      newThemes = selectedThemes.filter(t => t !== themeId);
    } else {
      newThemes = [...selectedThemes, themeId];
    }
    
    setSelectedThemes(newThemes);
    
    // Se estiver em uma sala e for o host, atualizar no banco
    if (roomId && isHost) {
      try {
        await (updateRoomSettings as any)({ data: { roomId, selectedThemes: newThemes } });
      } catch (err) {
        toast.error('Erro ao atualizar temas da sala');
      }
    }
  };

  const ThemeSelector = () => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl backdrop-blur-xl mb-4">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 text-center">Temas Ativos</h3>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => toggleTheme(theme.id)}
            className={`py-2.5 px-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedThemes.includes(theme.id) 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-black/20 border-white/5 text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{theme.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{theme.name}</span>
            </div>
            {selectedThemes.includes(theme.id) && (
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
  
  const GameSettingsSelector = () => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl backdrop-blur-xl mb-4 space-y-4">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Configurações da Partida</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tempo Base: {baseTime.toFixed(1)}s</label>
        </div>
        <input 
          type="range" 
          min="1.0" 
          max="10.0" 
          step="0.5"
          value={baseTime}
          onChange={async (e) => {
            const val = parseFloat(e.target.value);
            setBaseTime(val);
            if (roomId && isHost) {
              try {
                await (updateRoomSettings as any)({ data: { roomId, baseTime: val } });
              } catch (err) {
                toast.error('Erro ao atualizar tempo');
              }
            }
          }}
          className="w-full accent-cyan-500"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <RefreshCw size={12} className="text-cyan-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Aceleração Neural</span>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5">
          {(['OFF', 'SLOW', 'NORMAL', 'INSANE'] as const).map((intensity) => (
            <button
              key={intensity}
              onClick={async () => {
                setAccelerationIntensity(intensity);
                if (roomId && isHost) {
                  try {
                    await (updateRoomSettings as any)({ data: { roomId, accelerationIntensity: intensity, accelerationEnabled: intensity !== 'OFF' } });
                  } catch (err) {
                    toast.error('Erro ao atualizar aceleração');
                  }
                }
              }}
              className={`py-2 rounded-xl border text-[8px] font-black transition-all ${
                accelerationIntensity === intensity
                  ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/10'
              }`}
            >
              {intensity === 'OFF' ? 'OFF' : 
               intensity === 'SLOW' ? 'LENTA' : 
               intensity === 'NORMAL' ? 'NORMAL' : 'INSANA'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await (getGameHistory as any)();
      setHistory(data || []);
    } catch (err) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async (category: string | null = null) => {
    setLoading(true);
    setRankingCategory(category);
    try {
      const data = await (getLeaderboard as any)({ data: category });
      setRankings(data || []);
    } catch (err) {
      toast.error('Erro ao carregar rankings');
    } finally {
      setLoading(false);
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
                      onClick={() => {
                        if (session?.user?.is_anonymous) {
                          toast.info('Crie uma conta com Google para acessar seu perfil e salvar seu progresso!');
                          return;
                        }
                        setView('PROFILE');
                      }}
                      className={`flex items-center gap-3 ${session?.user?.is_anonymous ? 'opacity-50 cursor-help' : 'cursor-pointer'} group`}
                    >
                      <div className={`w-10 h-10 rounded-full ${session?.user?.is_anonymous ? 'bg-zinc-800' : 'bg-cyan-500/20'} flex items-center justify-center border ${session?.user?.is_anonymous ? 'border-zinc-700' : 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'} group-hover:scale-110 transition-transform`}>
                        {session?.user?.is_anonymous ? <Lock size={16} className="text-zinc-500" /> : <User size={20} className="text-cyan-400" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black truncate max-w-[120px] text-white group-hover:text-cyan-400 transition-colors">
                            {nickname || 'Cérebro Anônimo'}
                          </span>
                          {!session?.user?.is_anonymous && (
                             <span className="bg-cyan-500/20 text-cyan-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-cyan-500/20">LVL {profile?.level || 1}</span>
                          )}
                        </div>
                        {profile?.selected_title && (
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic animate-pulse">
                            « {profile.selected_title} »
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {session?.user?.is_anonymous ? (
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Visitante Temporário</span>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                                <span className="text-[10px] font-black text-yellow-500">{profile?.coins || 0}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">XP {profile?.xp || 0}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-zinc-600 hover:text-red-500 transition-colors ml-4" title="Sair"><LogOut size={18} /></button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setView('OFFLINE_SETTINGS')}
                  className="flex flex-col items-center justify-center p-6 bg-white text-black font-black rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all group"
                >
                  <Monitor size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">OFFLINE</span>
                </button>

                <button 
                  onClick={() => setView('MULTIPLAYER')}
                  className="flex flex-col items-center justify-center p-6 bg-cyan-500/10 border-2 border-cyan-500/30 text-cyan-500 font-black rounded-3xl active:scale-95 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-[8px] tracking-widest">{onlineCount}</span>
                  </div>
                  <Globe size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm uppercase">Online</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setView('SHOP')}
                    className="py-4 bg-zinc-900 border border-zinc-800 text-yellow-500 font-black text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase tracking-widest"
                  >
                    <ShoppingBag size={18} /> Loja
                  </button>
                  <button 
                    onClick={() => setView('MISSIONS')}
                    className="py-4 bg-zinc-900 border border-zinc-800 text-emerald-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase tracking-widest"
                  >
                    <Target size={18} /> Missões
                  </button>
                  <button 
                    onClick={() => {
                      setView('RANKING');
                      fetchRankings();
                    }}
                    className="py-4 bg-zinc-900 border border-zinc-800 text-cyan-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase tracking-widest"
                  >
                    <Trophy size={18} /> Ranking
                  </button>
                  
                  {session && !session.user.is_anonymous && (
                    <button 
                      disabled={rewardLoading || !isRewardAvailable()}
                      onClick={async () => {
                        setRewardLoading(true);
                        try {
                          const result = await (claimDailyReward as any)();
                          toast.success(`Você resgatou ${result.reward} Brain Coins!`);
                          await fetchProfile(session.user.id);
                        } catch (err: any) {
                          toast.error(err.message);
                        } finally {
                          setRewardLoading(false);
                        }
                      }}
                      className="py-4 bg-zinc-900 border border-zinc-800 text-emerald-500 font-black text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                      {rewardLoading ? (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Zap size={16} /> 
                          {isRewardAvailable() ? 'Recompensa' : formatTime(rewardTimeRemaining)}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {session && !session.user.is_anonymous && (
                  <button 
                    onClick={() => setView('REFERRAL')}
                    className="w-full py-4 bg-cyan-500/5 border border-cyan-500/20 text-cyan-500/60 font-black text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-500/10 transition-all uppercase tracking-widest"
                  >
                    <UserPlus size={14} /> Sistema de Indicação
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'OFFLINE_SETTINGS' && (
            <motion.div 
              key="offline-settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar ao Menu
              </button>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Configuração Neural</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Personalize sua experiência solo</p>
              </div>

              <ThemeSelector />
              <GameSettingsSelector />

              <div className="space-y-4 pt-2">
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl backdrop-blur-xl">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">Modo de Jogo</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setCustomization(profile?.selected_skin, profile?.selected_title, profile?.selected_font, profile?.selected_arena_effect);
                        startGame('NORMAL', undefined, baseTime, accelerationIntensity);
                      }}
                      className="py-4 bg-white text-black font-black text-xs rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 transition-all uppercase"
                    >
                      Normal
                    </button>
                    <button 
                      onClick={() => {
                        setCustomization(profile?.selected_skin, profile?.selected_title, profile?.selected_font, profile?.selected_arena_effect);
                        startGame('BLITZ', undefined, baseTime, accelerationIntensity);
                      }}
                      className="py-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black text-xs rounded-xl active:scale-95 transition-all uppercase"
                    >
                      Blitz
                    </button>
                    <button 
                      onClick={() => {
                        setCustomization(profile?.selected_skin, profile?.selected_title, profile?.selected_font, profile?.selected_arena_effect);
                        startGame('SURVIVAL', undefined, baseTime, accelerationIntensity);
                      }}
                      className="col-span-2 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black text-xs rounded-xl active:scale-95 transition-all uppercase"
                    >
                      Survival
                    </button>
                  </div>
                </div>

                <p className="text-center text-zinc-600 text-[8px] font-bold uppercase tracking-widest px-4">
                  Seu progresso offline também garante XP e moedas baseados na pontuação final!
                </p>
              </div>
            </motion.div>
          )}

          {view === 'REFERRAL' && (
            <motion.div 
              key="referral"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar
              </button>

              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl text-center space-y-6">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <UserPlus size={32} className="text-cyan-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white italic">INDIQUE E GANHE</h3>
                  <p className="text-zinc-500 text-xs mt-1">Convide amigos para a arena neural e ganhe <span className="text-yellow-500 font-bold">250 moedas</span> por cada um que entrar!</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Seu Código</p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-2xl font-black tracking-[0.3em] text-white uppercase">{profile?.referral_code || '------'}</span>
                      <button 
                        onClick={() => {
                          if (profile?.referral_code) {
                            navigator.clipboard.writeText(profile.referral_code);
                            toast.success('Código copiado!');
                          }
                        }}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}?ref=${profile?.referral_code}`;
                      const text = `🧠 Ei! Entre na Arena Neural do BRAINLAG comigo! Use meu link para ganhar 100 moedas iniciais: ${link}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'BRAINLAG - Convite para Arena',
                          text: text,
                          url: link
                        });
                      } else {
                        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                        window.open(whatsappUrl, '_blank');
                      }
                    }}
                    className="w-full py-5 bg-cyan-500 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} className="fill-current" /> CONVIDAR VIA WHATSAPP
                  </button>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Você já indicou <span className="text-cyan-400">{profile?.referral_count || 0}</span> amigos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-2xl flex items-start gap-3">
                <Trophy size={16} className="text-yellow-500 mt-0.5" />
                <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                  <strong>DICA:</strong> Compartilhe seu link em grupos! Seus amigos também ganham <span className="font-black">100 moedas</span> ao se cadastrarem pelo seu link.
                </p>
              </div>
            </motion.div>
          )}

          {view === 'SHOP' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full"
            >
              <Shop onClose={() => setView('MAIN')} />
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

              <ThemeSelector />
              <GameSettingsSelector />

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
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={copyCode}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-xl transition-colors active:scale-95"
                        title="Copiar Código"
                      >
                        <Copy className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => {
                          const text = `🧠 Entre na minha Arena do BRAINLAG! Código: ${roomCode}. Link: ${window.location.origin}?join=${roomCode}`;
                          if (navigator.share) {
                            navigator.share({
                              title: 'BRAINLAG - Convite para Sala',
                              text: text,
                              url: window.location.origin
                            });
                          } else {
                            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                            window.open(whatsappUrl, '_blank');
                          }
                        }}
                        className="text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 p-2 rounded-xl transition-colors active:scale-95"
                        title="Convidar via WhatsApp"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isHost && (
                <>
                  <ThemeSelector />
                  <GameSettingsSelector />
                </>
              )}

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
          {view === 'PROFILE' && !session?.user?.is_anonymous && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar
              </button>

              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[40px] backdrop-blur-xl flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <User size={48} className="text-cyan-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                    LVL {profile?.level || 1}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{nickname || 'Cérebro Anônimo'}</h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{session?.user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl text-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Moedas</span>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                      <span className="text-xl font-black text-white">{profile?.coins || 0}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl text-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Total XP</span>
                    <span className="text-xl font-black text-cyan-400">{profile?.xp || 0}</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nível Atual</span>
                    <span className="text-xs font-black text-white">Nível {profile?.level || 1}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden p-[1px] border border-zinc-700">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((profile?.xp || 0) % 1000) / 10}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-center font-bold text-zinc-600 uppercase tracking-widest">
                    {((profile?.xp || 0) % 1000)} / 1000 XP para o próximo nível
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setView('HISTORY');
                    fetchHistory();
                  }}
                  className="w-full py-4 bg-zinc-900 border border-zinc-800 text-cyan-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all uppercase tracking-widest"
                >
                  <History size={18} /> Histórico de Respostas
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 text-center">Editar Nickname</h3>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={nickname}
                       onChange={(e) => setNickname(e.target.value)}
                       className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-cyan-500/50 text-white"
                     />
                     <button 
                       onClick={async () => {
                         try {
                           await (updateProfile as any)({ data: { nickname } });
                           toast.success('Nickname atualizado!');
                           fetchProfile(session.user.id);
                         } catch (err) {
                           toast.error('Erro ao atualizar');
                         }
                       }}
                       className="px-4 py-2 bg-cyan-500 text-black font-black text-xs rounded-xl active:scale-95 transition-all"
                     >
                       SALVAR
                     </button>
                   </div>
                </div>

                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all uppercase tracking-[0.2em]"
                >
                  <LogOut size={14} /> Encerrar Protocolo (Sair)
                </button>
              </div>
            </motion.div>
          )}

          {view === 'HISTORY' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => setView('PROFILE')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar ao Perfil
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Análise Neural</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Últimas 10 respostas registradas</p>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sincronizando Dados...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhuma atividade registrada ainda</p>
                  </div>
                ) : (
                  history.map((item, i) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border backdrop-blur-sm flex items-center justify-between gap-4 ${
                        item.user_answer === item.is_correct 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase tracking-widest">
                            {item.theme || 'GERAL'}
                          </span>
                          <span className="text-[8px] font-bold text-zinc-600">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mb-1 truncate">
                          {item.command_text}
                        </p>
                        <h4 className="text-sm font-black text-white italic truncate uppercase">
                          {item.display_word || item.command_text}
                        </h4>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {item.user_answer === item.is_correct ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <span className="text-[10px] font-black uppercase tracking-widest">ACERTO</span>
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-500">
                            <span className="text-[10px] font-black uppercase tracking-widest">ERRO</span>
                            <XCircle size={16} />
                          </div>
                        )}
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                          Sua: {item.user_answer ? 'SIM' : 'NÃO'} • Correta: {item.is_correct ? 'SIM' : 'NÃO'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'RANKING' && (
            <motion.div 
              key="ranking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <button onClick={() => setView('MAIN')} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 hover:text-white transition-colors">
                <ChevronLeft size={14} /> Voltar ao Menu
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Elite Neural</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Global Hall of Fame</p>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollBy({ left: -120, behavior: 'smooth' });
                  }}
                  className="absolute left-[-10px] top-1/2 -translate-y-1/2 z-10 bg-black/80 border border-white/10 p-1.5 rounded-full backdrop-blur-md text-cyan-400 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-2 pb-2 no-scrollbar px-6 mask-fade-edges"
                >
                  <button 
                    onClick={() => fetchRankings(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${rankingCategory === null ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/5 text-zinc-500'}`}
                  >
                    Geral
                  </button>
                  {THEMES.map(theme => (
                    <button 
                      key={theme.id}
                      onClick={() => fetchRankings(theme.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${rankingCategory === theme.id ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-black/20 border-white/5 text-zinc-500'}`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollBy({ left: 120, behavior: 'smooth' });
                  }}
                  className="absolute right-[-10px] top-1/2 -translate-y-1/2 z-10 bg-black/80 border border-white/10 p-1.5 rounded-full backdrop-blur-md text-cyan-400 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : rankings.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhum registro nesta categoria</p>
                  </div>
                ) : (
                  rankings.map((entry, i) => (
                    <div 
                      key={entry.user_id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${
                        entry.user_id === session?.user?.id 
                          ? 'bg-cyan-500/10 border-cyan-500/30' 
                          : 'bg-zinc-900/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                          i === 1 ? 'bg-gray-300 text-black' :
                          i === 2 ? 'bg-amber-600 text-black' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-tight ${entry.user_id === session?.user?.id ? 'text-cyan-400' : 'text-white'}`}>
                            {entry.profiles?.nickname || 'Anônimo'}
                          </span>
                          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                            {rankingCategory ? 'Recorde Temático' : 'Recorde Geral'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-xl font-black italic tabular-nums ${
                          i === 0 ? 'text-yellow-500' : 'text-white'
                        }`}>
                          {rankingCategory ? entry[`score_${rankingCategory.toLowerCase()}`] : entry.score}
                        </span>
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Pontos</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
          {view === 'MISSIONS' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full"
            >
              <Missions 
                onBack={() => setView('MAIN')} 
                onUpdateProfile={() => session?.user?.id && fetchProfile(session.user.id)}
              />
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
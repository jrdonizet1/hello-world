import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Trophy, ChevronLeft, CheckCircle2, Circle, Coins, Star } from 'lucide-react';
import { getMissions, claimMissionReward } from '@/lib/server-functions';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  reward_xp: number;
  reward_power_slow?: number;
  reward_power_shield?: number;
  goal_type: string;
  goal_value: number;
  is_daily: boolean;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface MissionsProps {
  onBack: () => void;
  onUpdateProfile: () => void;
}

export const Missions: React.FC<MissionsProps> = ({ onBack, onUpdateProfile }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const data = await (getMissions as any)();
      setMissions(data || []);
    } catch (err) {
      toast.error('Erro ao carregar missões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleClaim = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      const result = await (claimMissionReward as any)({ data: missionId });
      toast.success(`Resgatado: ${result.reward_coins} Brain Coins e ${result.reward_xp} XP!`);
      onUpdateProfile();
      await fetchMissions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClaimingId(null);
    }
  };

  const dailyMissions = missions.filter(m => m.is_daily);
  const achievements = missions.filter(m => !m.is_daily);

  const MissionCard = ({ mission }: { mission: Mission }) => {
    const progressPercent = Math.min(100, (mission.progress / mission.goal_value) * 100);
    
    return (
      <motion.div 
        layout
        className={`bg-zinc-900/50 border ${mission.claimed ? 'border-zinc-800/30 opacity-60' : (mission.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800')} p-4 rounded-2xl relative overflow-hidden`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className={`text-sm font-black italic uppercase tracking-wider ${mission.completed && !mission.claimed ? 'text-emerald-400' : 'text-white'}`}>
              {mission.title}
            </h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">{mission.description}</p>
          </div>
          {mission.claimed ? (
            <CheckCircle2 size={16} className="text-zinc-600" />
          ) : mission.completed ? (
            <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black text-emerald-400 uppercase">
              Pronto
            </div>
          ) : (
             <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
               {mission.progress} / {mission.goal_value}
             </div>
          )}
        </div>

        {/* Progress Bar */}
        {!mission.claimed && (
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full ${mission.completed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <Coins size={10} className="text-yellow-500" />
              <span className="text-[10px] font-black text-yellow-500">{mission.reward_coins}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-cyan-400" />
              <span className="text-[10px] font-black text-cyan-400">{mission.reward_xp} XP</span>
            </div>
          </div>

          {mission.completed && !mission.claimed && (
            <button
              onClick={() => handleClaim(mission.id)}
              disabled={claimingId === mission.id}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-[10px] rounded-lg transition-all active:scale-95 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {claimingId === mission.id ? '...' : 'Resgatar'}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors">
          <ChevronLeft size={14} /> Voltar
        </button>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
          <Trophy size={12} className="text-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hub de Missões</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sincronizando Metas...</p>
          </div>
        ) : (
          <>
            {dailyMissions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                  <h3 className="text-xs font-black italic uppercase tracking-widest text-white">Missões Diárias</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-yellow-500/30 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {dailyMissions.map(mission => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Target size={14} className="text-cyan-500" />
                  <h3 className="text-xs font-black italic uppercase tracking-widest text-white">Conquistas</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {achievements.map(mission => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              </div>
            )}

            {missions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-zinc-500 text-[10px] font-bold uppercase">Nenhuma missão disponível no momento.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

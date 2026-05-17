import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coins, Check, Lock, Palette, Type, Monitor, Sparkles, Star, Zap, XCircle, ChevronRight, Shield, Crown, ShieldCheck, Infinity as InfinityIcon } from 'lucide-react';
import { getShopItems, buyShopItem, getUserInventory, updateEquippedItems, getProfile } from '../../lib/server-functions';
import { useGameStore } from '../../store/useGameStore';
import { toast } from 'sonner';

const NamePreview = ({ name, profile, skinColor, title, icon, effect }: any) => {
  const isCycle = effect?.type === 'cycle';
  const isGlow = effect?.type === 'glow';
  
  return (
    <div className="flex flex-col items-center gap-1 p-4 bg-black/60 rounded-2xl border border-white/10 mb-4 min-h-[80px] justify-center">
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">Prévia de Exibição</p>
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-white">
            {icon === 'Zap' && <Zap size={14} className="text-cyan-400" />}
            {icon === 'Crown' && <Crown size={14} className="text-yellow-500" />}
            {icon === 'ShieldCheck' && <ShieldCheck size={14} className="text-emerald-500" />}
            {icon === 'Infinity' && <InfinityIcon size={14} className="text-purple-500" />}
          </div>
        )}
        <div className="flex flex-col items-center">
          <motion.span 
            className="text-lg font-black italic uppercase tracking-tight"
            animate={isCycle ? {
              color: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ff0000'],
            } : {
              color: skinColor || '#ffffff',
            }}
            transition={isCycle ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
            style={{
              textShadow: isGlow ? `0 0 ${effect.intensity === 'high' ? '15px' : '8px'} ${skinColor || '#00f2ff'}` : 'none'
            }}
          >
            {name}
          </motion.span>
          {title && (
            <motion.span 
              className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70"
              animate={isCycle ? {
                color: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ff0000'],
              } : {
                color: skinColor || '#ffffff',
              }}
              transition={isCycle ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
            >
              « {title} »
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
};

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'skin' | 'title' | 'avatar' | 'font' | 'arena_effect' | 'power_up';
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  item_data: any;
}

export const Shop: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'COSMETICS' | 'POWERS' | 'MY_ITEMS'>('COSMETICS');
  const [cosmeticCategory, setCosmeticCategory] = useState<'all' | 'skin' | 'title' | 'font' | 'arena_effect' | 'avatar'>('all');

  const loadData = async () => {
    try {
      const [shopItems, userInv, userProfile] = await Promise.all([
        getShopItems(),
        getUserInventory(),
        getProfile()
      ]);
      const profileData = userProfile as any;
      setItems(shopItems as ShopItem[]);
      setInventory(userInv);
      setProfile(profileData);
      
      const { setPowerCounts } = useGameStore.getState();
      setPowerCounts(profileData.power_slow_count || 0, profileData.power_shield_count || 0);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuy = async (itemId: string, price: number) => {
    if (!profile) return;
    if (profile.coins < price) {
      toast.error('Moedas insuficientes!');
      return;
    }

    setBuying(itemId);
    try {
      await (buyShopItem as any)({ data: itemId });
      toast.success('Adquirido com sucesso!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro na compra');
    } finally {
      setBuying(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    try {
      const updateData: any = {};
      if (item.category === 'skin') updateData.skin = item.item_data.color;
      else if (item.category === 'title') updateData.title = item.item_data.text;
      else if (item.category === 'font') updateData.font = item.item_data;
      else if (item.category === 'arena_effect') {
        if (item.item_data.type === 'glow' || item.item_data.type === 'cycle') {
          updateData.effect = item.item_data;
        } else {
          updateData.arenaEffect = item.item_data;
        }
      }
      else if (item.category === 'avatar') updateData.icon = item.item_data.icon;

      await (updateEquippedItems as any)({ data: updateData });
      toast.success('Equipado com sucesso!');
      await loadData();
    } catch (err: any) {
      toast.error('Erro ao equipar item');
    }
  };

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'power_up') return false;
    if (item.category === 'skin') return profile?.selected_skin === item.item_data.color;
    if (item.category === 'title') return profile?.selected_title === item.item_data.text;
    if (item.category === 'font') return JSON.stringify(profile?.selected_font) === JSON.stringify(item.item_data);
    if (item.category === 'arena_effect') {
      if (item.item_data.type === 'glow' || item.item_data.type === 'cycle') {
        return JSON.stringify(profile?.selected_effect) === JSON.stringify(item.item_data);
      }
      return JSON.stringify(profile?.selected_arena_effect) === JSON.stringify(item.item_data);
    }
    if (item.category === 'avatar') return profile?.selected_icon === item.item_data.icon;
    return false;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Carregando Mercado Neural...</p>
      </div>
    );
  }

  const rarityColors = {
    COMMON: 'text-zinc-400 border-zinc-800 bg-zinc-900/40',
    RARE: 'text-blue-400 border-blue-900/30 bg-blue-950/20',
    EPIC: 'text-purple-400 border-purple-900/30 bg-purple-950/20',
    LEGENDARY: 'text-yellow-400 border-yellow-900/30 bg-yellow-950/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
  };

  const rarityLabel = {
    COMMON: 'Comum',
    RARE: 'Raro',
    EPIC: 'Épico',
    LEGENDARY: 'Lendário'
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header com Saldo */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Brain Coins</p>
            <p className="text-xl font-black tabular-nums text-white">{profile?.coins || 0}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
        >
          <XCircle size={24} />
        </button>
      </div>

      {/* Tabs Principais */}
      <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
        {[
          { id: 'COSMETICS', label: 'Loja', icon: ShoppingBag },
          { id: 'POWERS', label: 'Poderes', icon: Zap },
          { id: 'MY_ITEMS', label: 'Meu Inventário', icon: Star }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-categorias para Cosméticos */}
      {activeTab === 'COSMETICS' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'skin', label: 'Skins' },
            { id: 'title', label: 'Títulos' },
            { id: 'font', label: 'Fontes' },
            { id: 'arena_effect', label: 'Efeitos' },
            { id: 'avatar', label: 'Ícones' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCosmeticCategory(cat.id as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                cosmeticCategory === cat.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid de Itens */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
          {items
            .filter(item => {
              if (activeTab === 'POWERS') return item.category === 'power_up';
              if (activeTab === 'MY_ITEMS') return inventory.includes(item.id) && item.category !== 'power_up';
              if (activeTab === 'COSMETICS') {
                if (item.category === 'power_up') return false;
                if (cosmeticCategory === 'all') return true;
                return item.category === cosmeticCategory;
              }
              return true;
            })
            .map((item) => {
              const owned = inventory.includes(item.id) && item.category !== 'power_up';
              const equipped = isEquipped(item);
              const canAfford = (profile?.coins || 0) >= item.price;
              const currentRarity = item.rarity || 'COMMON';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-5 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col h-full ${
                    equipped 
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                      : owned 
                        ? 'border-white/20 bg-white/5' 
                        : rarityColors[currentRarity]
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                      currentRarity === 'LEGENDARY' ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-black/20 border-white/5'
                    }`}>
                      {rarityLabel[currentRarity]}
                    </span>
                    <div className="opacity-30">
                      {item.category === 'skin' ? <Palette size={14} /> : 
                       item.category === 'power_up' ? <Zap size={14} /> :
                       item.category === 'arena_effect' ? <Sparkles size={14} /> :
                       item.category === 'avatar' ? <Star size={14} /> :
                       <Type size={14} />}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className={`font-black italic text-lg uppercase tracking-tight mb-1 ${
                      currentRarity === 'LEGENDARY' ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600' : 'text-white'
                    }`}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tight">
                      {item.description}
                    </p>
                    
                    <div className="mt-4 mb-6">
                      {item.category === 'skin' && item.item_data.color !== 'rainbow' && (
                        <div 
                          className="w-full h-1.5 rounded-full" 
                          style={{ backgroundColor: item.item_data.color, boxShadow: `0 0 10px ${item.item_data.color}40` }}
                        />
                      )}
                      {item.category === 'skin' && item.item_data.color === 'rainbow' && (
                        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-pulse" />
                      )}
                      {item.category === 'title' && (
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] py-2 px-3 bg-black/40 rounded-xl border border-white/5 text-center" style={{ 
                          color: item.item_data.color || 'inherit',
                          textShadow: item.item_data.glow ? `0 0 10px ${item.item_data.color}` : 'none'
                        }}>
                          « {item.item_data.text} »
                        </div>
                      )}
                      {item.category === 'avatar' && (
                        <div className="flex justify-center py-2 bg-black/40 rounded-xl border border-white/5">
                          {item.item_data.icon === 'Zap' && <Zap size={24} className="text-cyan-400" />}
                          {item.item_data.icon === 'Crown' && <Crown size={24} className="text-yellow-500" />}
                          {item.item_data.icon === 'ShieldCheck' && <ShieldCheck size={24} className="text-emerald-500" />}
                          {item.item_data.icon === 'Infinity' && <InfinityIcon size={24} className="text-purple-500" />}
                        </div>
                      )}
                      {item.category === 'power_up' && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <div className={`p-2 rounded-lg bg-black/40 border border-white/5`}>
                            {item.item_data.powerId === 'slow' ? <Monitor size={16} className="text-blue-400" /> : <Shield size={16} className="text-purple-400" />}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Consumível
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    {!owned && item.category !== 'power_up' ? (
                      <div className="flex items-center gap-1.5">
                        <Coins size={12} className="text-yellow-500" />
                        <span className={`text-sm font-black ${canAfford ? 'text-white' : 'text-red-500'}`}>
                          {item.price}
                        </span>
                      </div>
                    ) : item.category === 'power_up' ? (
                      <div className="flex items-center gap-1.5">
                        <Coins size={12} className="text-yellow-500" />
                        <span className={`text-sm font-black ${canAfford ? 'text-white' : 'text-red-500'}`}>
                          {item.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">
                        Adquirido
                      </span>
                    )}

                    {owned ? (
                      <button
                        onClick={() => !equipped && handleEquip(item)}
                        disabled={equipped}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          equipped
                            ? 'bg-cyan-500 text-black cursor-default'
                            : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
                        }`}
                      >
                        {equipped ? 'Equipado' : 'Equipar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(item.id, item.price)}
                        disabled={buying === item.id || !canAfford}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          canAfford
                            ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20'
                            : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {buying === item.id ? '...' : item.category === 'power_up' ? 'Comprar Carga' : 'Comprar'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

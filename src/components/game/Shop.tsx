import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coins, Check, Lock, Palette, Type } from 'lucide-react';
import { getShopItems, buyShopItem, getUserInventory, updateEquippedItems, getProfile } from '../../lib/server-functions';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'skin' | 'title' | 'avatar' | 'font' | 'arena_effect';
  item_data: any;
}

export const Shop: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [shopItems, userInv, userProfile] = await Promise.all([
        getShopItems(),
        getUserInventory(),
        getProfile()
      ]);
      setItems(shopItems as ShopItem[]);
      setInventory(userInv);
      setProfile(userProfile);
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
      toast.success('Item adquirido com sucesso!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro na compra');
    } finally {
      setBuying(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    try {
      if (item.category === 'skin') {
        await (updateEquippedItems as any)({ data: { skin: item.item_data.color } });
      } else if (item.category === 'title') {
        await (updateEquippedItems as any)({ data: { title: item.item_data.text } });
      }
      toast.success('Equipado com sucesso!');
      await loadData();
    } catch (err: any) {
      toast.error('Erro ao equipar item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'skin') return profile?.selected_skin === item.item_data.color;
    if (item.category === 'title') return profile?.selected_title === item.item_data.text;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seu Saldo</p>
            <p className="text-xl font-black tabular-nums">{profile?.coins || 0} Moedas</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const owned = inventory.includes(item.id);
          const equipped = isEquipped(item);
          const canAfford = (profile?.coins || 0) >= item.price;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                equipped 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : owned 
                    ? 'border-white/20 bg-white/5' 
                    : 'border-white/5 bg-black/40'
              }`}
            >
              {/* Category Icon */}
              <div className="absolute top-4 right-4 opacity-20">
                {item.category === 'skin' ? <Palette className="w-8 h-8" /> : <Type className="w-8 h-8" />}
              </div>

              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <h3 className="font-black italic text-lg uppercase tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">
                    {item.description}
                  </p>
                  
                  {item.category === 'skin' && (
                    <div 
                      className="w-full h-2 rounded-full mb-2" 
                      style={{ backgroundColor: item.item_data.color, boxShadow: `0 0 10px ${item.item_data.color}40` }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  {!owned ? (
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className={`font-black ${canAfford ? 'text-white' : 'text-red-400'}`}>
                        {item.price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                      Adquirido
                    </span>
                  )}

                  {owned ? (
                    <button
                      onClick={() => !equipped && handleEquip(item)}
                      disabled={equipped}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        equipped
                          ? 'bg-cyan-500 text-black cursor-default'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {equipped ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-3 h-3" /> Equipado
                        </span>
                      ) : 'Equipar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item.id, item.price)}
                      disabled={buying === item.id || !canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        canAfford
                          ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {buying === item.id ? 'Processando...' : 'Comprar'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

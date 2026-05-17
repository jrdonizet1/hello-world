import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, ShoppingBag, BarChart3, ChevronLeft, 
  Settings, Trash2, Edit3, Plus, Search, Coins, Zap, Star
} from 'lucide-react';
import { 
  getAdminStats, getAllUsers, updateUserCoins, 
  getShopItems, deleteShopItem, upsertShopItem 
} from '@/lib/server-functions';
import { toast } from 'sonner';

export const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'SHOP'>('STATS');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadStats = async () => {
    try {
      const data = await (getAdminStats as any)();
      setStats(data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await (getAllUsers as any)();
      setUsers(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadShop = async () => {
    try {
      const data = await (getShopItems as any)();
      setShopItems(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (activeTab === 'STATS') await loadStats();
      if (activeTab === 'USERS') await loadUsers();
      if (activeTab === 'SHOP') await loadShop();
      setLoading(false);
    };
    init();
  }, [activeTab]);

  const handleUpdateCoins = async (userId: string, currentCoins: number) => {
    const amount = prompt('Novas Brain Coins:', currentCoins.toString());
    if (amount === null) return;
    
    const newCoins = parseInt(amount);
    if (isNaN(newCoins)) return toast.error('Valor inválido');

    try {
      await (updateUserCoins as any)({ data: { targetUserId: userId, coins: newCoins } });
      toast.success('Moedas atualizadas!');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;
    try {
      await (deleteShopItem as any)({ data: itemId });
      toast.success('Item removido!');
      loadShop();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (upsertShopItem as any)({ data: editingItem });
      toast.success(editingItem.id ? 'Item atualizado!' : 'Item criado!');
      setEditingItem(null);
      loadShop();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-black/95 text-white p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Painel de Controle</h2>
            <p className="text-[10px] text-cyan-400 font-mono tracking-[0.3em] uppercase opacity-70">Admin Neural Interface</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <Shield size={16} className="text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Root Access</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 w-fit">
        {[
          { id: 'STATS', label: 'Métricas', icon: BarChart3 },
          { id: 'USERS', label: 'Usuários', icon: Users },
          { id: 'SHOP', label: 'Loja', icon: ShoppingBag }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sincronizando com o Core...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'STATS' && stats && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  { label: 'Jogadores Totais', value: stats.totalUsers, icon: Users, color: 'text-cyan-400' },
                  { label: 'Salas Ativas', value: stats.activeRooms, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Moedas em Circulação', value: stats.totalCoins, icon: Coins, color: 'text-emerald-400' },
                  { label: 'Itens na Loja', value: stats.totalItems, icon: ShoppingBag, color: 'text-purple-400' }
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] backdrop-blur-xl">
                    <div className={`${s.color} mb-4`}><s.icon size={24} /></div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-3xl font-black italic">{s.value.toLocaleString()}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'USERS' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="BUSCAR JOGADOR POR NICK OU ID..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-cyan-500/30 font-bold uppercase tracking-widest text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black">
                          {user.level || 1}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight text-white">{user.nickname || 'Sem Nick'}</p>
                          <p className="text-[8px] font-mono text-zinc-600 tracking-tighter">{user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo</p>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-yellow-500 font-black">{user.coins || 0}</span>
                            <button 
                              onClick={() => handleUpdateCoins(user.id, user.coins || 0)}
                              className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-yellow-500 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Experiência</p>
                          <p className="text-white font-black">{user.xp || 0} XP</p>
                        </div>
                        <button className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-600 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'SHOP' && (
              <motion.div 
                key="shop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => setEditingItem({ name: '', description: '', price: 0, category: 'avatar', rarity: 'COMMON', item_data: {} })}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Plus size={20} /> Adicionar Novo Cosmético
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shopItems.map((item) => (
                    <div key={item.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-black/40 rounded-full border border-zinc-800">
                          {item.category}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg hover:bg-cyan-500 hover:text-black transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-black italic uppercase text-lg mb-1">{item.name}</h4>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-1.5 text-yellow-500">
                          <Coins size={14} />
                          <span className="font-black">{item.price}</span>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded border ${
                          item.rarity === 'LEGENDARY' ? 'border-yellow-500/50 text-yellow-500' : 
                          item.rarity === 'EPIC' ? 'border-purple-500/50 text-purple-500' :
                          'border-zinc-700 text-zinc-500'
                        }`}>
                          {item.rarity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Item Editor Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[40px] overflow-hidden p-8"
            >
              <h3 className="text-2xl font-black italic uppercase mb-6">Configuração de Item</h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Nome do Item</label>
                    <input 
                      required
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                      value={editingItem.name}
                      onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Preço (Coins)</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                      value={editingItem.price}
                      onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase">Descrição</label>
                  <textarea 
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50 h-20"
                    value={editingItem.description}
                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Categoria</label>
                    <select 
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                      value={editingItem.category}
                      onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    >
                      <option value="avatar">Avatar</option>
                      <option value="frame">Moldura</option>
                      <option value="skin">Skin</option>
                      <option value="title">Título</option>
                      <option value="font">Fonte</option>
                      <option value="arena_effect">Efeito de Arena</option>
                      <option value="power_up">Consumível</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Raridade</label>
                    <select 
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50"
                      value={editingItem.rarity}
                      onChange={e => setEditingItem({...editingItem, rarity: e.target.value})}
                    >
                      <option value="COMMON">Comum</option>
                      <option value="RARE">Raro</option>
                      <option value="EPIC">Épico</option>
                      <option value="LEGENDARY">Lendário</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase">Dados do Item (JSON)</label>
                  <textarea 
                    placeholder='{"url": "...", "color": "..."}'
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-mono text-[10px] outline-none focus:border-cyan-500/50 h-32"
                    value={JSON.stringify(editingItem.item_data, null, 2)}
                    onChange={e => {
                      try {
                        const data = JSON.parse(e.target.value);
                        setEditingItem({...editingItem, item_data: data});
                      } catch (err) {}
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-cyan-500 text-black hover:bg-cyan-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Salvar Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
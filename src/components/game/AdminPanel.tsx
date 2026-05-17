import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, ShoppingBag, BarChart3, ChevronLeft, 
  Settings, Trash2, Edit3, Plus, Search, Coins, Zap, Star,
  UserCheck, UserMinus, Monitor, Layout, Sparkles, Type, Palette,
  XCircle, Play, Timer, Lock, Globe, AlertTriangle, Bell, Save
} from 'lucide-react';
import { 
  getAdminStats, getAllUsers, updateUserCoins, 
  getShopItems, deleteShopItem, upsertShopItem,
  getActiveRooms, closeRoom, getSystemSettings, updateSystemSettings
} from '@/lib/server-functions';
import { toast } from 'sonner';
import { UserAvatar } from './UserAvatar';
import { UserIdentity } from './UserIdentity';

export const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'USERS' | 'SHOP' | 'ROOMS' | 'SYSTEM'>('STATS');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'registered' | 'visitor'>('all');

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
  const loadRooms = async () => {
    try {
      const data = await (getActiveRooms as any)();
      setRooms(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  const loadSystem = async () => {
    try {
      const data = await (getSystemSettings as any)();
      setSystemSettings(data);
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
      if (activeTab === 'ROOMS') await loadRooms();
      if (activeTab === 'SYSTEM') await loadSystem();
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

  const handleCloseRoom = async (roomId: string) => {
    if (!confirm('Encerrar esta sala e expulsar jogadores?')) return;
    try {
      await (closeRoom as any)({ data: roomId });
      toast.success('Sala encerrada!');
      loadRooms();
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm);
    // Simulação simples de visitante: usuários sem email cadastrado ou com IDs de guest seriam ideais,
    // mas aqui usaremos a lógica de se ele tem um nickname definido (visitantes costumam ter nomes provisórios)
    // No nosso app, usuários anônimos do Supabase Auth são os visitantes.
    // Como não temos o e-mail no profile, vamos usar o nickname ou outra lógica se disponível.
    if (userFilter === 'registered') return u.nickname && !u.nickname.startsWith('GUEST_');
    if (userFilter === 'visitor') return !u.nickname || u.nickname.startsWith('GUEST_');
    return matchesSearch;
  });

  const filteredShopItems = shopItems.filter(item => 
    shopCategory === 'all' || item.category === shopCategory
  );

  return (
    <div className="flex flex-col h-full bg-black text-white p-6 overflow-hidden">
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
      <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'STATS', label: 'Métricas', icon: BarChart3 },
          { id: 'USERS', label: 'Usuários', icon: Users },
          { id: 'SHOP', label: 'Loja', icon: ShoppingBag },
          { id: 'ROOMS', label: 'Salas', icon: Globe },
          { id: 'SYSTEM', label: 'Sistema', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
                  { label: 'Salas Lobby Ativas', value: stats.activeRooms, icon: Globe, color: 'text-yellow-400' },
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
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" 
                      placeholder="BUSCAR POR NICK OU ID..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-cyan-500/30 font-bold uppercase tracking-widest text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    {[
                      { id: 'all', label: 'Todos', icon: Users },
                      { id: 'registered', label: 'Registrados', icon: UserCheck },
                      { id: 'visitor', label: 'Visitantes', icon: UserMinus }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setUserFilter(f.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          userFilter === f.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'
                        }`}
                      >
                        <f.icon size={14} />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <div key={user.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between hover:bg-zinc-900/60 transition-colors group">
                      <div className="flex items-center gap-4">
                        <UserAvatar url={user.avatar_url} level={user.level} size="sm" frame={user.selected_frame} />
                        <div>
                          <div className="flex items-center gap-2">
                            <UserIdentity 
                              name={user.nickname || 'Anônimo'} 
                              skin={user.selected_skin}
                              title={user.selected_title}
                              size="sm"
                              showTitle={false}
                            />
                            {user.is_admin && <Shield size={12} className="text-red-500 fill-red-500/20" />}
                            {(!user.nickname || user.nickname.startsWith('GUEST_')) && (
                              <span className="text-[7px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded uppercase font-black tracking-widest">Visitante</span>
                            )}
                          </div>
                          <p className="text-[8px] font-mono text-zinc-600 tracking-tighter mt-0.5">{user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo</p>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-yellow-500 font-black">{user.coins || 0}</span>
                            <button 
                              onClick={() => handleUpdateCoins(user.id, user.coins || 0)}
                              className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-yellow-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nível</p>
                          <p className="text-white font-black">{user.level || 1} <span className="text-[8px] text-zinc-500 font-normal">({user.xp || 0} XP)</span></p>
                        </div>
                        <button className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                       <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">Nenhum usuário encontrado</p>
                    </div>
                  )}
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
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {[
                      { id: 'all', label: 'Tudo', icon: Layout },
                      { id: 'avatar', label: 'Avatares', icon: Monitor },
                      { id: 'frame', label: 'Molduras', icon: Layout },
                      { id: 'skin', label: 'Skins', icon: Palette },
                      { id: 'title', label: 'Títulos', icon: Type },
                      { id: 'font', label: 'Fontes', icon: Type },
                      { id: 'arena_effect', label: 'Efeitos', icon: Sparkles },
                      { id: 'power_up', label: 'Poderes', icon: Zap }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setShopCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                          shopCategory === cat.id ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <cat.icon size={14} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setEditingItem({ name: '', description: '', price: 0, category: 'avatar', rarity: 'COMMON', item_data: {} })}
                    className="w-full md:w-auto px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={18} /> Novo Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredShopItems.map((item) => (
                    <div key={item.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
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

                      {/* Preview do Item */}
                      <div className="flex flex-col items-center gap-4 mb-6 p-4 bg-black/40 rounded-2xl border border-white/5">
                        {item.category === 'avatar' && <UserAvatar url={item.item_data.url} size="lg" showLevel={false} />}
                        {item.category === 'frame' && <UserAvatar url={null} size="lg" frame={item.item_data} showLevel={false} />}
                        {item.category === 'title' && <UserIdentity name="User" title={item.item_data.text} showTitle={true} />}
                        {item.category === 'skin' && (
                          <UserIdentity name="User" skin={item.item_data} title="Skin Test" size="sm" />
                        )}
                        {item.category === 'font' && (
                          <UserIdentity name="User" font={item.item_data} title="Font Test" size="sm" />
                        )}
                        {item.category === 'power_up' && <div className="p-4 bg-cyan-500/10 rounded-full text-cyan-400"><Zap size={32} /></div>}
                        {item.category === 'arena_effect' && <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 italic flex items-center gap-2"><Sparkles size={14} /> Arena FX</p>}

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

            {activeTab === 'ROOMS' && (
              <motion.div 
                key="rooms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[32px] space-y-4 relative group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${room.status === 'LOBBY' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{room.status}</span>
                        </div>
                        <button 
                          onClick={() => handleCloseRoom(room.id)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xl font-black italic uppercase text-white flex items-center gap-2">
                          {room.name}
                          {room.is_private && <Lock size={14} className="text-zinc-600" />}
                        </h4>
                        <p className="text-4xl font-black tracking-tighter text-cyan-500/30 font-mono mt-1">{room.code}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                        <div className="text-center p-2 bg-black/40 rounded-xl">
                          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Jogadores</p>
                          <p className="text-sm font-black">{room.players?.length || 0} / {room.max_players}</p>
                        </div>
                        <div className="text-center p-2 bg-black/40 rounded-xl">
                          <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Privacidade</p>
                          <p className="text-[10px] font-black uppercase text-zinc-400">{room.is_private ? 'Privada' : 'Pública'}</p>
                        </div>
                      </div>

                      {room.players && room.players.length > 0 && (
                        <div className="pt-4 space-y-2">
                          <p className="text-[8px] font-black text-zinc-600 uppercase">Em Campo:</p>
                          <div className="flex flex-wrap gap-2">
                            {room.players.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-lg">
                                <UserAvatar url={p.avatar_url} size="sm" showLevel={false} className="scale-75 -ml-1" />
                                <span className="text-[9px] font-bold text-zinc-300 truncate max-w-[80px]">{p.nickname || 'Anônimo'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 pt-2">
                        {room.selected_themes?.map((t: string) => (
                          <span key={t} className="text-[7px] font-black px-2 py-0.5 bg-cyan-500/10 rounded-full text-cyan-500/50 uppercase tracking-widest">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {rooms.length === 0 && (
                    <div className="col-span-full py-20 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-[40px] text-center">
                      <Globe size={48} className="mx-auto text-zinc-800 mb-4 opacity-20" />
                      <p className="text-zinc-600 font-black uppercase tracking-[0.2em] text-sm">Nenhuma sala ativa no radar neural</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Item Editor Modal (mesmo de antes mas com preview dinâmico) */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[40px] overflow-hidden p-8 flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 space-y-6">
                <h3 className="text-2xl font-black italic uppercase">Editor de Item</h3>
                <form onSubmit={handleSaveItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase">Nome</label>
                      <input 
                        required
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"
                        value={editingItem.name}
                        onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase">Preço</label>
                      <input 
                        type="number"
                        required
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"
                        value={editingItem.price}
                        onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Descrição</label>
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm h-16"
                      value={editingItem.description}
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase">Categoria</label>
                      <select 
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"
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
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"
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
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Configuração Visual (JSON)</label>
                    <textarea 
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-mono text-[10px] h-32"
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
                    <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                    <button type="submit" className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl font-black uppercase text-[10px]">Salvar</button>
                  </div>
                </form>
              </div>

              {/* Live Preview no Editor */}
              <div className="w-full md:w-56 bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col items-center justify-center gap-6">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Neural Preview</p>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                   <div className="relative">
                     <UserAvatar 
                       url={editingItem.category === 'avatar' ? editingItem.item_data?.url : null} 
                       size="xl" 
                       showLevel={false} 
                       frame={editingItem.category === 'frame' ? editingItem.item_data : null}
                     />
                   </div>
                   
                   <UserIdentity 
                     name="Neural-X" 
                     skin={editingItem.category === 'skin' ? editingItem.item_data : null}
                     title={editingItem.category === 'title' ? editingItem.item_data?.text : 'Explorer'}
                     font={editingItem.category === 'font' ? editingItem.item_data : null}
                     size="md"
                     showTitle={true}
                   />
                </div>
                <div className="w-full pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-white text-center uppercase tracking-tight">{editingItem.name || 'Nome do Item'}</p>
                  <p className="text-center text-yellow-500 font-black text-xs">{editingItem.price} Coins</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
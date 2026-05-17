import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const saveScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { score } = data;
    const { userId } = context;

    // Buscar perfil atual para atualizar XP e Moedas
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("xp, coins, level")
      .eq("id", userId)
      .single();

    if (profileError) throw new Error(profileError.message);

    const xpGained = score * 10;
    const coinsGained = Math.floor(score / 5);
    const newXp = profile.xp + xpGained;
    const newCoins = profile.coins + coinsGained;
    
    // Lógica simples de level up: cada level precisa de 1000 XP
    const newLevel = Math.floor(newXp / 1000) + 1;
    const leveledUp = newLevel > profile.level;

    // Atualizar perfil com novos ganhos
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        xp: newXp, 
        coins: newCoins, 
        level: newLevel 
      })
      .eq("id", userId);

    if (updateError) throw new Error(updateError.message);

    // Salvar no leaderboard se for recorde pessoal
    const { data: currentEntry } = await supabaseAdmin
      .from("leaderboard")
      .select("score")
      .eq("user_id", userId)
      .single();

    if (!currentEntry || currentEntry.score < score) {
      await supabaseAdmin
        .from("leaderboard")
        .upsert({ user_id: userId, score }, { onConflict: "user_id" });
    }

    return { 
      success: true, 
      xpGained, 
      coinsGained, 
      newLevel, 
      leveledUp,
      totalCoins: newCoins,
      totalXp: newXp
    };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("leaderboard")
      .select(`
        score,
        user_id,
        profiles (
          nickname,
          avatar_url
        )
      `)
      .order("score", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    return data.filter(entry => entry.profiles !== null);
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { nickname, roomId, isReady } = data;
    const { userId } = context;

    const updateData: any = { id: userId };
    if (nickname !== undefined) updateData.nickname = nickname;
    if (roomId !== undefined) updateData.room_id = roomId;
    if (isReady !== undefined) updateData.is_ready = isReady;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(updateData, { onConflict: "id" });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const claimDailyReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("last_daily_reward, coins")
      .eq("id", userId)
      .single();

    if (!profile) throw new Error("Perfil não encontrado");

    const now = new Date();
    const lastReward = profile.last_daily_reward ? new Date(profile.last_daily_reward) : null;
    
    // Verificar se já passou de 24 horas ou se é um novo dia
    if (lastReward) {
      const diff = now.getTime() - lastReward.getTime();
      const hours = diff / (1000 * 60 * 60);
      if (hours < 24) {
        throw new Error(`Volte em ${Math.ceil(24 - hours)} horas para sua próxima recompensa!`);
      }
    }

    const reward = 100; // 100 moedas grátis
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        coins: (profile.coins || 0) + reward,
        last_daily_reward: now.toISOString()
      })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return { success: true, reward };
  });

export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: roomSettings, context } = args;
    const { userId } = context;
    const { name, maxPlayers, isPrivate, password } = roomSettings;

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({ 
        code, 
        host_id: userId, 
        status: 'LOBBY',
        name: name || 'Arena Neural',
        max_players: maxPlayers || 4,
        is_private: isPrivate || false,
        password: password || null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Join room
    await supabaseAdmin
      .from("profiles")
      .update({ room_id: data.id, is_ready: false })
      .eq("id", userId);

    return data;
  });

export const joinRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { code, password } = data;
    const { userId } = context;

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select()
      .eq("code", code.toUpperCase())
      .single();

    if (roomError || !room) throw new Error("Sala não encontrada");

    // Check password if private
    if (room.is_private && room.password !== password) {
      throw new Error("Senha incorreta");
    }

    // Check max players
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    const maxPlayers = room.max_players ?? 4;
    if (count !== null && count >= maxPlayers) {
      throw new Error("Sala cheia");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ room_id: room.id, is_ready: false })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return room;
  });

export const startRoomGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: roomId, context } = args;
    const { userId } = context;

    const { data: room } = await supabaseAdmin
      .from("rooms")
      .select("host_id")
      .eq("id", roomId)
      .single();

    if (!room || room.host_id !== userId) throw new Error("Apenas o host pode iniciar");

    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ status: 'STARTING' })
      .eq("id", roomId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const leaveRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    // 1. Buscar a sala atual do usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("room_id")
      .eq("id", userId)
      .single();

    if (!profile || !profile.room_id) return { success: true };

    const roomId = profile.room_id;

    // 2. Remover usuário da sala
    await supabaseAdmin
      .from("profiles")
      .update({ room_id: null, is_ready: false })
      .eq("id", userId);

    // 3. Verificar se ainda há jogadores
    const { data: remainingPlayers } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("room_id", roomId);

    if (!remainingPlayers || remainingPlayers.length === 0) {
      // Deletar sala se vazia
      await supabaseAdmin
        .from("rooms")
        .delete()
        .eq("id", roomId);
    } else {
      // Verificar se o host saiu
      const { data: room } = await supabaseAdmin
        .from("rooms")
        .select("host_id")
        .eq("id", roomId)
        .single();

      if (room && room.host_id === userId) {
        // Passar host para o próximo jogador
        await supabaseAdmin
          .from("rooms")
          .update({ host_id: remainingPlayers[0].id })
          .eq("id", roomId);
      }
    }

    return { success: true };
  });

export const getShopItems = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("shop_items")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  });

export const getUserInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    const { data, error } = await supabaseAdmin
      .from("user_inventory")
      .select("item_id")
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return data.map((item: any) => item.item_id);
  });

export const buyShopItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: itemId, context } = args;
    const { userId } = context;

    const { data, error } = await supabaseAdmin.rpc("purchase_item", {
      p_user_id: userId,
      p_item_id: itemId
    });

    if (error) throw new Error(error.message);
    
    const result = data as any;
    if (!result.success) throw new Error(result.message);
    
    return result;
  });

export const updateEquippedItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { skin, title } = data;
    const { userId } = context;

    const updateData: any = {};
    if (skin !== undefined) updateData.selected_skin = skin;
    if (title !== undefined) updateData.selected_title = title;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

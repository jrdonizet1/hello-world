import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const saveScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { score, themeScores, maxCombo } = data;
    const { userId } = context;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("xp, coins, level")
      .eq("id", userId)
      .single();

    if (profileError) throw new Error(profileError.message);

    const xpGained = (score * 10) + (maxCombo || 0);
    const coinsGained = Math.floor(score / 5) + Math.floor((maxCombo || 0) / 10);
    const newXp = profile.xp + xpGained;
    const newCoins = (profile.coins || 0) + coinsGained;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const leveledUp = newLevel > profile.level;

    await supabaseAdmin
      .from("profiles")
      .update({ xp: newXp, coins: newCoins, level: newLevel })
      .eq("id", userId);

    const { data: currentEntry } = await supabaseAdmin
      .from("leaderboard")
      .select("*")
      .eq("user_id", userId)
      .single();

    const updateData: any = { user_id: userId };
    if (!currentEntry || currentEntry.score < score) updateData.score = score;

    if (themeScores) {
      Object.entries(themeScores).forEach(([themeId, tScore]: [string, any]) => {
        const colName = `score_${themeId.toLowerCase()}`;
        if (!currentEntry || (currentEntry as any)[colName] < tScore) {
          updateData[colName] = tScore;
        }
      });
    }

    await supabaseAdmin
      .from("leaderboard")
      .upsert(updateData, { onConflict: "user_id" });

    // --- Atualização de Missões ---
    try {
      const { data: missions } = await supabaseAdmin
        .from("missions")
        .select("*");

      if (missions) {
        for (const mission of missions) {
          let progressDelta = 0;
          let isAbsolute = false;

          if (mission.goal_type === 'SCORE' && score >= mission.goal_value) {
            progressDelta = mission.goal_value;
            isAbsolute = true;
          } else if (mission.goal_type === 'COMBO' && (maxCombo || 0) >= mission.goal_value) {
            progressDelta = mission.goal_value;
            isAbsolute = true;
          } else if (mission.goal_type === 'GAMES_PLAYED') {
            progressDelta = 1;
          } else if (mission.goal_type.startsWith('THEME_HITS_')) {
            const themeId = mission.goal_type.replace('THEME_HITS_', '');
            if (themeScores && themeScores[themeId]) {
              progressDelta = themeScores[themeId];
            }
          }

          if (progressDelta > 0) {
            const { data: currentProg } = await supabaseAdmin
              .from("user_missions")
              .select("*")
              .eq("user_id", userId)
              .eq("mission_id", mission.id)
              .maybeSingle();

            if (!currentProg) {
              await supabaseAdmin.from("user_missions").insert({
                user_id: userId,
                mission_id: mission.id,
                progress: progressDelta,
                completed: progressDelta >= mission.goal_value
              });
            } else if (!currentProg.completed) {
              const newProgress = isAbsolute 
                ? Math.max((currentProg.progress || 0), progressDelta)
                : (currentProg.progress || 0) + progressDelta;
                
              await supabaseAdmin.from("user_missions").update({
                progress: newProgress,
                completed: newProgress >= mission.goal_value,
                last_updated: new Date().toISOString()
              }).eq("id", currentProg.id);
            }
          }
        }
      }
    } catch (mErr) {
      console.error("Erro ao atualizar missões:", mErr);
    }
    // ------------------------------

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
  .handler(async (args: any) => {
    const { data: category } = args || {};
    const colName = category ? `score_${category.toLowerCase()}` : 'score';
    
    const { data, error } = await supabaseAdmin
      .from("leaderboard")
      .select(`
        score,
        score_color,
        score_math,
        score_general,
        score_curiosity,
        score_sequence,
        score_capital,
        score_scale,
        user_id,
        profiles (
          nickname,
          avatar_url
        )
      `)
      .order(colName, { ascending: false })
      .limit(20);

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
    const { name, maxPlayers, isPrivate, password, selectedThemes, baseTime, accelerationIntensity } = roomSettings;

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
        password: password || null,
        selected_themes: selectedThemes || ['COLOR', 'MATH'],
        base_time: baseTime || 2.2,
        acceleration_intensity: accelerationIntensity || 'NORMAL',
        acceleration_enabled: accelerationIntensity !== 'OFF'
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

    const { data: item } = await supabaseAdmin
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (!item) throw new Error("Item não encontrado");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();

    if (!profile || (profile.coins || 0) < item.price) {
      throw new Error("Moedas insuficientes");
    }

    // Process purchase based on category
    if (item.category === 'power_up') {
      const itemData = item.item_data as any;
      const powerId = itemData.powerId;
      const colName = powerId === 'slow' ? 'power_slow_count' : 'power_shield_count';
      
      const updateData: any = { 
        coins: profile.coins - item.price
      };
      updateData[colName] = (profile as any)[colName] + 1;

      await supabaseAdmin
        .from("profiles")
        .update(updateData as any)
        .eq("id", userId);
    } else {
      const { data, error } = await supabaseAdmin.rpc("purchase_item", {
        p_user_id: userId,
        p_item_id: itemId
      });
      if (error) throw new Error(error.message);
    }
    
    return { success: true };
  });

export const updateEquippedItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { skin, title, font, arenaEffect } = data;
    const { userId } = context;

    const updateData: any = {};
    if (skin !== undefined) updateData.selected_skin = skin;
    if (title !== undefined) updateData.selected_title = title;
    if (font !== undefined) updateData.selected_font = font;
    if (arenaEffect !== undefined) updateData.selected_arena_effect = arenaEffect;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const redeemReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: code, context } = args;
    const { userId } = context;

    const { data, error } = await supabaseAdmin.rpc("redeem_referral", {
      p_user_id: userId,
      p_code: code.toUpperCase()
    });

    if (error) throw new Error(error.message);
    
    const result = data as any;
    if (!result.success) throw new Error(result.message);
    
    return result;
  });

export const updateRoomSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { roomId, selectedThemes, baseTime, accelerationIntensity } = data;
    const { userId } = context;

    const { data: room } = await supabaseAdmin
      .from("rooms")
      .select("host_id")
      .eq("id", roomId)
      .single();

    if (!room || room.host_id !== userId) throw new Error("Apenas o host pode alterar as configurações");

    const updateData: any = {};
    if (selectedThemes) updateData.selected_themes = selectedThemes;
    if (baseTime !== undefined) updateData.base_time = baseTime;
    if (accelerationIntensity !== undefined) {
      updateData.acceleration_intensity = accelerationIntensity;
      updateData.acceleration_enabled = accelerationIntensity !== 'OFF';
    }

    const { error } = await supabaseAdmin
      .from("rooms")
      .update(updateData)
      .eq("id", roomId);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveGameHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { commandText, displayWord, isCorrect, userAnswer, theme } = data;
    const { userId } = context;

    const { error } = await supabaseAdmin
      .from("game_history")
      .insert({
        user_id: userId,
        command_text: commandText,
        display_word: displayWord,
        is_correct: isCorrect,
        user_answer: userAnswer,
        theme: theme
      });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getGameHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    const { data, error } = await supabaseAdmin
      .from("game_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    return data;
  });

export const getMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    // Obter todas as missões ativas
    const { data: missions, error: missionsError } = await supabaseAdmin
      .from("missions")
      .select("*");

    if (missionsError) throw new Error(missionsError.message);

    // Obter progresso do usuário
    const { data: userMissions, error: userMissionsError } = await supabaseAdmin
      .from("user_missions")
      .select("*")
      .eq("user_id", userId);

    if (userMissionsError) throw new Error(userMissionsError.message);

    return (missions || []).map(m => {
      const prog = userMissions?.find(um => um.mission_id === m.id);
      return {
        ...m,
        progress: prog?.progress || 0,
        completed: prog?.completed || false,
        claimed: prog?.claimed || false
      };
    });
  });

export const claimMissionReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: missionId, context } = args;
    const { userId } = context;

    const { data: userMission, error: umError } = await supabaseAdmin
      .from("user_missions")
      .select("*, missions(*)")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .single();

    if (umError || !userMission) throw new Error("Missão não encontrada");
    if (!userMission.completed) throw new Error("Missão ainda não foi concluída");
    if (userMission.claimed) throw new Error("Recompensa já resgatada");

    // Marcar como resgatado
    const { error: claimError } = await supabaseAdmin
      .from("user_missions")
      .update({ claimed: true })
      .eq("id", userMission.id);

    if (claimError) throw new Error(claimError.message);

    // Adicionar moedas e XP ao perfil
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("coins, xp")
      .eq("id", userId)
      .single();

    const missionData = userMission.missions as any;
    const newCoins = (profile?.coins || 0) + (missionData.reward_coins || 0);
    const newXp = (profile?.xp || 0) + (missionData.reward_xp || 0);

    await supabaseAdmin
      .from("profiles")
      .update({ 
        coins: newCoins,
        xp: newXp
      })
      .eq("id", userId);

    return { 
      success: true, 
      reward_coins: missionData.reward_coins,
      reward_xp: missionData.reward_xp,
      totalCoins: newCoins
    };
  });

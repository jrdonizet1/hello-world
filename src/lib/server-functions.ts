import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const saveScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { score } = data;
    const { userId } = context;

    const { data: currentEntry } = await supabaseAdmin
      .from("leaderboard")
      .select("score")
      .eq("user_id", userId)
      .single();

    if (currentEntry && currentEntry.score >= score) {
      return { success: true, message: "Novo score não é maior que o atual." };
    }

    const { error } = await supabaseAdmin
      .from("leaderboard")
      .upsert({ user_id: userId, score }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
    return { success: true };
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
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data, context } = args;
    const { nickname, roomId } = data;
    const { userId } = context;

    const updateData: any = { id: userId };
    if (nickname !== undefined) updateData.nickname = nickname;
    if (roomId !== undefined) updateData.room_id = roomId;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(updateData, { onConflict: "id" });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { context } = args;
    const { userId } = context;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({ code, host_id: userId, status: 'LOBBY' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Join room
    await supabaseAdmin
      .from("profiles")
      .update({ room_id: data.id })
      .eq("id", userId);

    return data;
  });

export const joinRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (args: any) => {
    const { data: code, context } = args;
    const { userId } = context;

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select()
      .eq("code", code.toUpperCase())
      .single();

    if (roomError || !room) throw new Error("Sala não encontrada");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ room_id: room.id })
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

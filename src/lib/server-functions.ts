import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const saveScore = createServerFn({ method: "POST" })
  .validator((d: { score: number }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { score } = data;

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
  .validator((d: { nickname: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { nickname } = data;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, nickname }, { onConflict: "id" });

    if (error) throw new Error(error.message);
    return { success: true };
  });


-- =========================================
-- 1. PROFILES: prevent privilege escalation
-- =========================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own readiness" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / SECURITY DEFINER server-side updates to bypass these checks
  IF auth.uid() IS NULL OR auth.uid() <> NEW.id THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.coins IS DISTINCT FROM OLD.coins
    OR NEW.xp IS DISTINCT FROM OLD.xp
    OR NEW.level IS DISTINCT FROM OLD.level
    OR NEW.duel_elo IS DISTINCT FROM OLD.duel_elo
    OR NEW.duel_wins IS DISTINCT FROM OLD.duel_wins
    OR NEW.power_slow_count IS DISTINCT FROM OLD.power_slow_count
    OR NEW.power_shield_count IS DISTINCT FROM OLD.power_shield_count
    OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
    OR NEW.referred_by_id IS DISTINCT FROM OLD.referred_by_id
    OR NEW.referral_count IS DISTINCT FROM OLD.referral_count
    OR NEW.last_daily_reward IS DISTINCT FROM OLD.last_daily_reward
  THEN
    RAISE EXCEPTION 'Cannot modify privileged columns from client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privileged_profile_update_trigger ON public.profiles;
CREATE TRIGGER prevent_privileged_profile_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_privileged_profile_update();

-- =========================================
-- 2. SECURITY DEFINER RPCs: verify caller
-- =========================================
CREATE OR REPLACE FUNCTION public.purchase_item(p_user_id uuid, p_item_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item_price INTEGER;
    v_user_coins INTEGER;
    v_item_exists BOOLEAN;
    v_already_owned BOOLEAN;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN json_build_object('success', false, 'message', 'Acesso negado');
    END IF;

    SELECT price, true INTO v_item_price, v_item_exists FROM public.shop_items WHERE id = p_item_id;
    IF v_item_exists IS NOT TRUE THEN
        RETURN json_build_object('success', false, 'message', 'Item não encontrado');
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.user_inventory WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_already_owned;
    IF v_already_owned THEN
        RETURN json_build_object('success', false, 'message', 'Você já possui este item');
    END IF;

    SELECT coins INTO v_user_coins FROM public.profiles WHERE id = p_user_id;
    IF v_user_coins < v_item_price THEN
        RETURN json_build_object('success', false, 'message', 'Moedas insuficientes');
    END IF;

    UPDATE public.profiles SET coins = coins - v_item_price WHERE id = p_user_id;
    INSERT INTO public.user_inventory (user_id, item_id) VALUES (p_user_id, p_item_id);

    RETURN json_build_object('success', true, 'message', 'Compra realizada com sucesso');
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_referral(p_user_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_user_referred_by UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acesso negado');
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_code;
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código de indicação inválido');
  END IF;
  IF v_referrer_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não pode usar seu próprio código');
  END IF;

  SELECT referred_by_id INTO v_user_referred_by FROM public.profiles WHERE id = p_user_id;
  IF v_user_referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já resgatou um código de indicação');
  END IF;

  UPDATE public.profiles SET referred_by_id = v_referrer_id WHERE id = p_user_id;
  UPDATE public.profiles
  SET coins = coins + 250, referral_count = referral_count + 1
  WHERE id = v_referrer_id;
  UPDATE public.profiles SET coins = coins + 100 WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Código resgatado com sucesso! Você ganhou 100 moedas.');
END;
$$;

-- =========================================
-- 3. ROOMS: hide password column from clients
-- =========================================
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Authenticated users can view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.rooms FROM anon, authenticated;
GRANT SELECT (
  id, code, host_id, status, player_count, created_at, updated_at,
  name, is_private, max_players, selected_themes, base_time,
  acceleration_enabled, acceleration_intensity
) ON public.rooms TO authenticated;

-- =========================================
-- 4. LEADERBOARD: server-only writes
-- =========================================
DROP POLICY IF EXISTS "Leaderboard is viewable by everyone" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can insert their own score" ON public.leaderboard;
DROP POLICY IF EXISTS "Users can update their own higher score" ON public.leaderboard;

CREATE POLICY "Authenticated users can view leaderboard"
ON public.leaderboard FOR SELECT
TO authenticated
USING (true);

-- =========================================
-- 5. USER_MISSIONS: server-only writes
-- =========================================
DROP POLICY IF EXISTS "Users can insert their own mission progress" ON public.user_missions;
DROP POLICY IF EXISTS "Users can update their own mission progress" ON public.user_missions;
DROP POLICY IF EXISTS "Users can view their own mission progress" ON public.user_missions;

CREATE POLICY "Users can view their own mission progress"
ON public.user_missions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =========================================
-- 6. DUEL_LOGS: only participants
-- =========================================
DROP POLICY IF EXISTS "Users can view all duel logs" ON public.duel_logs;
CREATE POLICY "Participants can view their duel logs"
ON public.duel_logs FOR SELECT
TO authenticated
USING (auth.uid() = winner_id OR auth.uid() = loser_id);

-- =========================================
-- 7. Function search_path hardening
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

-- Revoke execute on privileged definer functions from anon
REVOKE EXECUTE ON FUNCTION public.purchase_item(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_referral(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

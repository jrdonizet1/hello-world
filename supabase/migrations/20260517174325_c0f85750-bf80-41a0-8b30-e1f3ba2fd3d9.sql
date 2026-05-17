-- Add referral columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Function to generate a unique short referral code
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
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
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Update existing profiles that don't have a referral code
UPDATE public.profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION public.redeem_referral(p_user_id UUID, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_user_referred_by UUID;
BEGIN
  -- 1. Find referrer by code
  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código de indicação inválido');
  END IF;
  
  IF v_referrer_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não pode usar seu próprio código');
  END IF;
  
  -- 2. Check if user was already referred
  SELECT referred_by_id INTO v_user_referred_by FROM public.profiles WHERE id = p_user_id;
  
  IF v_user_referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já resgatou um código de indicação');
  END IF;
  
  -- 3. Set referred_by_id for the user
  UPDATE public.profiles SET referred_by_id = v_referrer_id WHERE id = p_user_id;
  
  -- 4. Reward the referrer (e.g., 250 coins and increment count)
  UPDATE public.profiles 
  SET 
    coins = coins + 250,
    referral_count = referral_count + 1
  WHERE id = v_referrer_id;
  
  -- 5. Reward the new user (e.g., 100 coins)
  UPDATE public.profiles SET coins = coins + 100 WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Código resgatado com sucesso! Você ganhou 100 moedas.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create shop_items table
CREATE TABLE public.shop_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL CHECK (category IN ('skin', 'title', 'avatar')),
    item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_inventory table
CREATE TABLE public.user_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, item_id)
);

-- Add selection columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN selected_skin TEXT DEFAULT 'cyan',
ADD COLUMN selected_title TEXT;

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for shop_items
CREATE POLICY "Shop items are viewable by everyone" 
ON public.shop_items FOR SELECT USING (true);

-- Policies for user_inventory
CREATE POLICY "Users can view their own inventory" 
ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);

-- Function to safely purchase an item
CREATE OR REPLACE FUNCTION public.purchase_item(p_user_id UUID, p_item_id UUID)
RETURNS JSON AS $$
DECLARE
    v_item_price INTEGER;
    v_user_coins INTEGER;
    v_item_exists BOOLEAN;
    v_already_owned BOOLEAN;
BEGIN
    -- Check if item exists and get price
    SELECT price, true INTO v_item_price, v_item_exists FROM public.shop_items WHERE id = p_item_id;
    
    IF v_item_exists IS NOT TRUE THEN
        RETURN json_build_object('success', false, 'message', 'Item não encontrado');
    END IF;

    -- Check if user already owns it
    SELECT EXISTS(SELECT 1 FROM public.user_inventory WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_already_owned;
    
    IF v_already_owned THEN
        RETURN json_build_object('success', false, 'message', 'Você já possui este item');
    END IF;

    -- Get user coins
    SELECT coins INTO v_user_coins FROM public.profiles WHERE id = p_user_id;
    
    IF v_user_coins < v_item_price THEN
        RETURN json_build_object('success', false, 'message', 'Moedas insuficientes');
    END IF;

    -- Transaction
    UPDATE public.profiles SET coins = coins - v_item_price WHERE id = p_user_id;
    INSERT INTO public.user_inventory (user_id, item_id) VALUES (p_user_id, p_item_id);

    RETURN json_build_object('success', true, 'message', 'Compra realizada com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial items
INSERT INTO public.shop_items (name, description, price, category, item_data) VALUES
('Neon Blue', 'A cor clássica da Matrix neural.', 0, 'skin', '{"color": "#06b6d4", "cssClass": "text-cyan-400"}'),
('Matrix Green', 'Sinta-se dentro do código.', 250, 'skin', '{"color": "#22c55e", "cssClass": "text-green-500"}'),
('Vaporwave Pink', 'Estética retro-futurista.', 500, 'skin', '{"color": "#ec4899", "cssClass": "text-pink-500"}'),
('Cyber Orange', 'Aviso: Sobrecarga sensorial.', 750, 'skin', '{"color": "#f97316", "cssClass": "text-orange-500"}'),
('Gold Edition', 'Puro luxo para campeões.', 2000, 'skin', '{"color": "#eab308", "cssClass": "text-yellow-500"}'),
('Brain Master', 'Título para quem domina os impulsos.', 300, 'title', '{"text": "Brain Master"}'),
('Lag Slayer', 'O terror das conexões lentas.', 600, 'title', '{"text": "Lag Slayer"}'),
('Hacker Neural', 'Você vê além do óbvio.', 1200, 'title', '{"text": "Hacker Neural"}');

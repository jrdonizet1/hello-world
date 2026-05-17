-- Add quantity column to user_inventory for consumables
ALTER TABLE public.user_inventory ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add richer fields to shop_items
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'COMMON'; -- 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Update shop categories check
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_category_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_category_check 
CHECK (category = ANY (ARRAY['skin'::text, 'title'::text, 'avatar'::text, 'font'::text, 'arena_effect'::text, 'power_up'::text]));

-- Insert Power-Ups
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data) VALUES
('Cápsula de Tempo', 'Item consumível: Desacelera o tempo por 5 segundos.', 150, 'power_up', 'RARE', '{"powerId": "slow", "type": "consumable"}'),
('Escudo Neural', 'Item consumível: Protege contra 1 erro durante a partida.', 300, 'power_up', 'EPIC', '{"powerId": "shield", "type": "consumable"}');

-- Insert Premium Titles and Skins
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data) VALUES
('Lendário', 'Título com efeito de brilho dourado.', 2500, 'title', 'LEGENDARY', '{"text": "Lendário", "color": "#eab308", "glow": true}'),
('Anomalia', 'Skin que muda de cor constantemente.', 5000, 'skin', 'LEGENDARY', '{"color": "rainbow", "cssClass": "animate-pulse"}');

-- Add columns to profiles to track consumable counts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS power_slow_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS power_shield_count INTEGER DEFAULT 0;

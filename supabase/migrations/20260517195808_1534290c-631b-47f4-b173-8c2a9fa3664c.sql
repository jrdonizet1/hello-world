-- Update category check constraint
ALTER TABLE public.shop_items DROP CONSTRAINT shop_items_category_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_category_check CHECK (category = ANY (ARRAY['skin'::text, 'title'::text, 'avatar'::text, 'font'::text, 'arena_effect'::text]));

-- Add fonts to the shop
INSERT INTO public.shop_items (name, description, price, category, item_data) VALUES
('Pixel Code', 'Estilo retro 8-bit para seus comandos.', 400, 'font', '{"fontFamily": "Press Start 2P", "size": "0.8em"}'),
('Cyber Display', 'Fonte futurista de alta visibilidade.', 800, 'font', '{"fontFamily": "Orbitron", "size": "1.1em"}'),
('Mono Hacker', 'O clássico terminal de hacker.', 200, 'font', '{"fontFamily": "JetBrains Mono", "size": "1em"}');

-- Add Arena Effects to the shop
INSERT INTO public.shop_items (name, description, price, category, item_data) VALUES
('Chuva Binária', 'Rastros de 0s e 1s caindo ao fundo.', 1500, 'arena_effect', '{"type": "binary", "color": "#22c55e"}'),
('Pulso Espacial', 'Nebulosas que reagem ao seu ritmo.', 2500, 'arena_effect', '{"type": "nebula", "color": "#a855f7"}'),
('Grade Synthwave', 'Uma grade infinita que acelera com você.', 1000, 'arena_effect', '{"type": "grid", "color": "#ec4899"}');

-- Add columns to profiles for new cosmetics
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_font JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_arena_effect JSONB;

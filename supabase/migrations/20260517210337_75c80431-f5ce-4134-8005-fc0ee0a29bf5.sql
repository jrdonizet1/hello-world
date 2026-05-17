-- 1. Atualizar constraint de categorias
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_category_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_category_check 
CHECK (category = ANY (ARRAY['skin'::text, 'title'::text, 'avatar'::text, 'font'::text, 'arena_effect'::text, 'power_up'::text, 'icon'::text]));

-- 2. Corrigir itens antigos que usavam 'avatar' como categoria mas eram ícones de nome
UPDATE public.shop_items SET category = 'icon' WHERE category = 'avatar' AND (item_data->>'url' IS NULL OR item_data->>'url' = '');

-- 3. Adicionar novos Avatares (Foto de Perfil / GIFs)
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data)
VALUES 
('Cérebro Neon', 'Um cérebro pulsando em luz neon ciana.', 500, 'avatar', 'RARE', '{"url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjPZOJvOpxBw4/giphy.gif"}'),
('Chip Quântico', 'Interface neural de alto processamento.', 750, 'avatar', 'EPIC', '{"url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfuxV5F6K475u/giphy.gif"}'),
('Singularidade', 'O horizonte de eventos da inteligência.', 1500, 'avatar', 'LEGENDARY', '{"url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxPucVzyNPy/giphy.gif"}'),
('Astronauta Digital', 'Explorador dos confins do ciberespaço.', 300, 'avatar', 'COMMON', '{"url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndXN5amZndSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwzHLARxFS/giphy.gif"}'),
('Cérebro Gold', 'Puro luxo intelectual.', 2000, 'avatar', 'LEGENDARY', '{"url": "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0bmZ0JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0Exhc2tZp7Xp89dm/giphy.gif"}');

-- 4. Adicionar novos Ícones (Símbolos ao lado do nome)
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data)
VALUES 
('Fogo Azul', 'Chamas de processamento intenso.', 400, 'icon', 'RARE', '{"type": "lucide", "icon": "Flame", "color": "#06b6d4"}'),
('Diamante', 'Mente inquebrável.', 800, 'icon', 'EPIC', '{"type": "lucide", "icon": "Gem", "color": "#a855f7"}'),
('Crânio Cyber', 'Para os veteranos do sistema.', 600, 'icon', 'RARE', '{"type": "lucide", "icon": "Skull", "color": "#ef4444"}'),
('Estrela de Nêutrons', 'Brilho denso e imparável.', 1200, 'icon', 'LEGENDARY', '{"type": "lucide", "icon": "Star", "color": "#eab308"}');

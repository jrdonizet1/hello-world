-- Altera colunas para jsonb para suportar objetos complexos
ALTER TABLE public.profiles 
ALTER COLUMN selected_icon TYPE jsonb USING to_jsonb(selected_icon),
ALTER COLUMN selected_effect TYPE jsonb USING to_jsonb(selected_effect);

-- Adiciona novos itens de Ícones (Imagens/GIFs)
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data) VALUES 
('Cérebro Galáctico', 'Um cérebro contendo o próprio universo.', 800, 'avatar', 'EPIC', '{"type": "image", "url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q1eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JnVwPTA/l41lTfuxV5l020fK0/giphy.gif"}'),
('Cyber Glitch', 'Efeito de distorção neural agressivo.', 1200, 'avatar', 'LEGENDARY', '{"type": "image", "url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q1eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JnVwPTA/3o7TKMGpxVfUvO2q6Q/giphy.gif"}'),
('Chama Azul', 'O fogo da inteligência pura.', 500, 'avatar', 'RARE', '{"type": "image", "url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q1eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JnVwPTA/3o7TKSj0qC8Yqq7yfe/giphy.gif"}'),
('Orb de Energia', 'Sincronização perfeita de dados.', 300, 'avatar', 'COMMON', '{"type": "image", "url": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q1eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4JnVwPTA/3o7TKMGpxVfUvO2q6Q/giphy.gif"}');

-- Adiciona mais opções de skins e efeitos
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data) VALUES 
('Supernova', 'Brilho estelar intenso para o seu nome.', 1500, 'arena_effect', 'LEGENDARY', '{"type": "glow", "intensity": "extreme", "color": "#ffffff"}'),
('Prisma Infinito', 'Ciclo de cores ultrarrápido.', 2000, 'arena_effect', 'LEGENDARY', '{"type": "cycle", "speed": "fast"}');

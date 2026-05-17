-- Adiciona colunas para ícones e efeitos no perfil
ALTER TABLE public.profiles 
ADD COLUMN selected_icon TEXT DEFAULT NULL,
ADD COLUMN selected_effect TEXT DEFAULT NULL;

-- Inserir novos itens na loja: ÍCONES
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data)
VALUES 
('Neurônio de Prata', 'Um ícone básico para iniciantes.', 500, 'avatar', 'COMMON', '{"icon": "Zap"}'),
('Coroa do Mestre', 'Para quem domina a arena.', 2500, 'avatar', 'EPIC', '{"icon": "Crown"}'),
('Cérebro Blindado', 'Resistência mental absoluta.', 1500, 'avatar', 'RARE', '{"icon": "ShieldCheck"}'),
('Símbolo do Infinito', 'Seu conhecimento não tem limites.', 5000, 'avatar', 'LEGENDARY', '{"icon": "Infinity"}');

-- Inserir novos itens na loja: EFEITOS DE NOME
INSERT INTO public.shop_items (name, description, price, category, rarity, item_data)
VALUES 
('Aura de Neon', 'Um brilho suave constante ao redor do seu nome.', 3000, 'arena_effect', 'RARE', '{"type": "glow", "intensity": "low"}'),
('Pulso Elétrico', 'Efeito de brilho que pulsa intensamente.', 6000, 'arena_effect', 'EPIC', '{"type": "glow", "intensity": "high", "pulse": true}'),
('Ciclo Prismático', 'Seu nome troca de cor constantemente (RGB).', 10000, 'arena_effect', 'LEGENDARY', '{"type": "cycle"}');

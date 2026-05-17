-- Adiciona colunas de recompensas de poderes
ALTER TABLE public.missions 
ADD COLUMN reward_power_slow INTEGER DEFAULT 0,
ADD COLUMN reward_power_shield INTEGER DEFAULT 0;

-- Adiciona novas missões focadas em poderes
INSERT INTO public.missions (title, description, reward_coins, reward_xp, reward_power_slow, reward_power_shield, goal_type, goal_value, is_daily)
VALUES 
('Mestre do Tempo', 'Use o Tempo Lento em 3 partidas diferentes', 50, 200, 1, 0, 'USE_POWER_SLOW', 3, true),
('Neural Inabalável', 'Use o Escudo Neural em 2 partidas diferentes', 50, 200, 0, 1, 'USE_POWER_SHIELD', 2, true),
('Sobrevivente Extremo', 'Alcance 500 pontos sem usar nenhum poder', 150, 500, 1, 1, 'SCORE_NO_POWER', 500, false);

-- Nota: Os novos goal_types precisarão ser implementados no saveScore se quisermos que funcionem automaticamente,
-- mas por enquanto vamos focar em adicionar recompensas às missões existentes também.

UPDATE public.missions 
SET reward_power_slow = 1 
WHERE title = 'Veterano Neural';

UPDATE public.missions 
SET reward_power_shield = 1 
WHERE title = 'Especialista em Cores';

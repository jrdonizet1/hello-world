-- Adicionar colunas de progressão na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0 NOT NULL;

-- Criar um índice para o ranking por nível/xp se necessário no futuro
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles (xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles (level DESC);

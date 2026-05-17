-- Create missions table
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    goal_type TEXT NOT NULL, -- 'SCORE', 'COMBO', 'GAMES_PLAYED', 'THEME_HITS'
    goal_value INTEGER NOT NULL,
    is_daily BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for missions (viewable by all)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions are viewable by everyone" ON public.missions FOR SELECT USING (true);

-- Create user_missions table
CREATE TABLE public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    mission_id UUID REFERENCES public.missions NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, mission_id)
);

-- Enable RLS for user_missions
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mission progress" 
ON public.user_missions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mission progress" 
ON public.user_missions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mission progress" 
ON public.user_missions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add some initial missions
INSERT INTO public.missions (title, description, reward_coins, reward_xp, goal_type, goal_value, is_daily) VALUES
('Novato Neural', 'Alcance uma pontuação de 20 em uma única partida.', 100, 50, 'SCORE', 20, false),
('Mestre do Combo', 'Alcance um combo de 5x.', 150, 75, 'COMBO', 5, false),
('Cérebro Resistente', 'Jogue 5 partidas.', 50, 25, 'GAMES_PLAYED', 5, true),
('Velocidade Máxima', 'Alcance uma pontuação de 50.', 500, 200, 'SCORE', 50, false),
('Especialista em Cores', 'Acerte 20 comandos de cores.', 100, 50, 'THEME_HITS_COLOR', 20, true);

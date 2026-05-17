-- Update rooms status check to include DUELING
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check CHECK (status = ANY (ARRAY['LOBBY'::text, 'STARTING'::text, 'PLAYING'::text, 'FINISHED'::text, 'DUELING'::text]));

-- Add competitive stats to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_wins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_elo INTEGER DEFAULT 1000;

-- Create duel_logs table for match history
CREATE TABLE public.duel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES public.profiles(id),
    loser_id UUID REFERENCES public.profiles(id),
    winner_score INTEGER,
    loser_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for duel_logs
ALTER TABLE public.duel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all duel logs" ON public.duel_logs FOR SELECT USING (true);

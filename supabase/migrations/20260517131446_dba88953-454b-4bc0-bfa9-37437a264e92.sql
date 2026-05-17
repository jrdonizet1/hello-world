-- Add direct relationship between leaderboard and profiles for PostgREST joins
ALTER TABLE public.leaderboard
DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey,
ADD CONSTRAINT leaderboard_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add index for the foreign key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);

-- Ensure all leaderboard entries have a corresponding profile
DELETE FROM public.leaderboard WHERE user_id NOT IN (SELECT id FROM public.profiles);

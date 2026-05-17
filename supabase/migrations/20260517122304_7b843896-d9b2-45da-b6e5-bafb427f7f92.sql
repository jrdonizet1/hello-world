-- Add missing columns to rooms
ALTER TABLE public.rooms 
ADD COLUMN name TEXT DEFAULT 'Arena Neural',
ADD COLUMN is_private BOOLEAN DEFAULT FALSE,
ADD COLUMN password TEXT;

-- Add is_ready to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_ready BOOLEAN DEFAULT FALSE;

-- Policies for profiles update
-- Check if policy exists first to avoid error
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own readiness'
    ) THEN
        CREATE POLICY "Users can update their own readiness" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;

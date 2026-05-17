ALTER TABLE public.rooms 
ADD COLUMN selected_themes TEXT[] DEFAULT ARRAY['COLOR', 'MATH'];
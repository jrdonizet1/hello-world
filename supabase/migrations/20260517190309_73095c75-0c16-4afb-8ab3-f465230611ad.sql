ALTER TABLE public.rooms 
ADD COLUMN acceleration_intensity TEXT DEFAULT 'NORMAL';

-- Update existing rooms to match the new format
UPDATE public.rooms SET acceleration_intensity = 'OFF' WHERE acceleration_enabled = false;
UPDATE public.rooms SET acceleration_intensity = 'NORMAL' WHERE acceleration_enabled = true;
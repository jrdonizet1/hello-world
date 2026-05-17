CREATE POLICY "Host can delete their room" 
ON public.rooms 
FOR DELETE 
USING (auth.uid() = host_id);
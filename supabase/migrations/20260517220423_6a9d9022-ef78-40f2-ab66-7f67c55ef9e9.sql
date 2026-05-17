CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Public read access for system_settings" ON public.system_settings
  FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admin full access for system_settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insert default settings
INSERT INTO public.system_settings (key, value) VALUES 
('maintenance_mode', '{"enabled": false, "message": "Arena em manutenção neural. Voltamos em breve."}'),
('global_announcement', '{"text": "Bem-vindo à nova versão da Arena Neural!", "active": true}');

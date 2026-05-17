ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Opcional: Definir o primeiro usuário como admin (substitua pelo seu ID se quiser fazer manual, 
-- ou faremos via interface se possível, mas por segurança o banco é o melhor lugar)
-- UPDATE public.profiles SET is_admin = true WHERE id = 'seu-uuid-aqui';

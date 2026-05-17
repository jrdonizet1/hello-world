-- Converte ícones de string simples para objeto JSON
UPDATE public.profiles 
SET selected_icon = jsonb_build_object('icon', selected_icon#>>'{}')
WHERE jsonb_typeof(selected_icon) = 'string';

-- O mesmo para efeitos, se necessário (geralmente efeitos já eram salvos como objetos no JS, mas a coluna era texto)
-- Se o efeito for uma string "null" ou similar, limpamos
UPDATE public.profiles
SET selected_effect = NULL
WHERE selected_effect#>>'{}' = 'null' OR selected_effect#>>'{}' = '';

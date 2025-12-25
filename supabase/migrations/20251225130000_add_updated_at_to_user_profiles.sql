-- Adiciona a coluna updated_at na tabela user_profiles_familia
-- Correção para erro no RPC change_user_password que tentava atualizar esta coluna inexistente

ALTER TABLE public.user_profiles_familia 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

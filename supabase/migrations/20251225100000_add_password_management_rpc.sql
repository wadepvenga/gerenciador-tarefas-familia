-- 🛡️ GESTÃO DE SENHAS - VERSÃO FAMÍLIA VENGA
-- Permite que administradores alterem senhas de outros usuários com segurança via RPC

-- Habilitar extensão necessária para criptografia se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

/**
 * 🔐 RPC: change_user_password
 * 
 * Permite que um admin altere a senha de qualquer usuário do seu núcleo familiar.
 * Usa SECURITY DEFINER para poder atualizar a tabela auth.users.
 */
CREATE OR REPLACE FUNCTION public.change_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Permite acesso de admin
AS $$
DECLARE
    caller_id UUID := auth.uid();
    caller_role TEXT;
    encrypted_pw TEXT;
    target_email TEXT;
BEGIN
    -- 1. VERIFICAÇÃO DE QUEM ESTÁ CHAMANDO
    -- Somente admins ou o próprio usuário podem mudar a senha
    -- Usamos SELECT direto para ignorar RLS durante a verificação
    SELECT role INTO caller_role FROM public.user_profiles_familia WHERE user_id = caller_id;
    
    IF caller_role != 'admin' AND caller_id != target_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem alterar senhas de terceiros.');
    END IF;

    -- 2. BUSCAR DADOS DO ALVO
    SELECT email INTO target_email FROM public.user_profiles_familia WHERE user_id = target_user_id;
    
    IF target_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário alvo não encontrado.');
    END IF;

    -- 3. CRIPTOGRAFAR NOVA SENHA
    -- Supabase usa bcrypt (bf) para senhas
    encrypted_pw := crypt(new_password, gen_salt('bf'));

    -- 4. ATUALIZAR TABELA AUTH.USERS
    UPDATE auth.users 
    SET 
        encrypted_password = encrypted_pw,
        updated_at = now()
    WHERE id = target_user_id;

    -- 5. ATUALIZAR PERFIL (Forçar troca no próximo login se for o admin mudando)
    IF caller_id != target_user_id THEN
        UPDATE public.user_profiles_familia 
        SET 
            first_login_completed = false,
            updated_at = now()
        WHERE user_id = target_user_id;
    END IF;

    -- 6. LOG DE AUDITORIA (Opcional, mas recomendado)
    INSERT INTO public.password_change_logs (
        changed_by,
        target_user,
        target_email,
        change_type
    ) VALUES (
        caller_id,
        target_user_id,
        target_email,
        CASE WHEN caller_id = target_user_id THEN 'self_change' ELSE 'admin_reset' END
    );

    RETURN jsonb_build_object('success', true, 'message', 'Senha alterada com sucesso!');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Tabela de logs para auditoria de segurança
CREATE TABLE IF NOT EXISTS public.password_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    changed_by UUID REFERENCES auth.users(id),
    target_user UUID REFERENCES auth.users(id),
    target_email TEXT,
    change_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.password_change_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins leem os logs
CREATE POLICY "Admin view logs" ON public.password_change_logs 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles_familia WHERE user_id = auth.uid() AND role = 'admin')
);

-- Garantir permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.change_user_password(UUID, TEXT) TO authenticated;

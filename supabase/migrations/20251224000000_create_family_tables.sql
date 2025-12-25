-- CORREÇÃO FINAL E ROBUSTA - VERSÃO FAMÍLIA
-- Resolve erros 401, 406 e recursividade de RLS.

-- 1. Limpeza de Políticas Obsoletas
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('user_profiles_familia', 'tasks_familia')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
    END LOOP;
END $$;

-- 2. Estrutura de Tabelas
CREATE TABLE IF NOT EXISTS public.user_profiles_familia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pai',
    is_active BOOLEAN DEFAULT TRUE,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    first_login_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.tasks_familia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    priority TEXT NOT NULL DEFAULT 'media',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_users UUID[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_private BOOLEAN DEFAULT FALSE,
    edited_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- 3. Configuração de Segurança (RLS)
ALTER TABLE public.user_profiles_familia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks_familia ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS user_profiles_familia
CREATE POLICY "Leitura pública autenticada" ON public.user_profiles_familia FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Inserção pelo próprio usuário" ON public.user_profiles_familia FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update pelo próprio ou admin" ON public.user_profiles_familia FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.user_profiles_familia WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Delete exclusivo admin" ON public.user_profiles_familia FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles_familia WHERE user_id = auth.uid() AND role = 'admin')
);

-- POLÍTICAS tasks_familia
CREATE POLICY "Leitura de tarefas permitidas" ON public.tasks_familia FOR SELECT USING (
    auth.uid() = created_by OR auth.uid() = ANY(assigned_users) OR is_private = false
);
CREATE POLICY "Criação de tarefas" ON public.tasks_familia FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Edição de tarefas" ON public.tasks_familia FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = ANY(assigned_users) OR 
    EXISTS (SELECT 1 FROM public.user_profiles_familia WHERE user_id = auth.uid() AND role IN ('admin', 'pai', 'mae'))
);
CREATE POLICY "Remoção de tarefas" ON public.tasks_familia FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.user_profiles_familia WHERE user_id = auth.uid() AND role IN ('admin', 'pai', 'mae'))
);

-- 4. Sincronização e Manutenção de Dados
-- Garante que todos os usuários existentes tenham um perfil na nova tabela
INSERT INTO public.user_profiles_familia (user_id, name, email, role, is_active, created_at, first_login_completed)
SELECT user_id, name, email, role, is_active, created_at, COALESCE(first_login_completed, false)
FROM public.user_profiles
ON CONFLICT (user_id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Garantir que pelo menos o usuário atual (Master) tenha papel de admin se for necessário
-- (Opcional, mas ajuda no primeiro acesso)
UPDATE public.user_profiles_familia SET role = 'admin' WHERE email = 'gestao@painel.com'; -- Exemplo de e-mail master, ajuste se souber o real.

-- EXCLUSÃO DE POLÍTICAS ANTIGAS (Limpeza Total para evitar conflitos)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('user_profiles_familia', 'tasks_familia', 'family_nuclei')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
    END LOOP;
END $$;

-- 1. Criação da Tabela de Núcleos
CREATE TABLE IF NOT EXISTS public.family_nuclei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.family_nuclei ENABLE ROW LEVEL SECURITY;

-- 2. Inserir o Núcleo Padrão
INSERT INTO public.family_nuclei (name, description)
VALUES ('Família Venga', 'Núcleo principal da família Venga')
ON CONFLICT (name) DO NOTHING;

-- 3. Atualizar Tabelas Existentes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.user_profiles_familia'::regclass AND attname = 'family_id') THEN
        ALTER TABLE public.user_profiles_familia ADD COLUMN family_id UUID REFERENCES public.family_nuclei(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.tasks_familia'::regclass AND attname = 'family_id') THEN
        ALTER TABLE public.tasks_familia ADD COLUMN family_id UUID REFERENCES public.family_nuclei(id);
    END IF;
END $$;

-- 4. Migrar Dados para o Núcleo Padrão
DO $$
DECLARE
    venga_id UUID;
BEGIN
    SELECT id INTO venga_id FROM public.family_nuclei WHERE name = 'Família Venga';
    UPDATE public.user_profiles_familia SET family_id = venga_id WHERE family_id IS NULL;
    UPDATE public.tasks_familia SET family_id = venga_id WHERE family_id IS NULL;
END $$;

-- 5. FUNÇÕES AUXILIARES (Para quebrar a recursão Infinita do RLS)
-- Usamos SECURITY DEFINER para que a busca ignore o RLS da própria tabela durante a verificação
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS UUID AS $$
    SELECT family_id FROM public.user_profiles_familia WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles_familia 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. POLÍTICAS family_nuclei
CREATE POLICY "Leitura de núcleos por admins" ON public.family_nuclei FOR SELECT USING (is_admin());
CREATE POLICY "Gestão de núcleos por admins" ON public.family_nuclei FOR ALL USING (is_admin());

-- 7. POLÍTICAS user_profiles_familia
CREATE POLICY "Ver perfis do mesmo núcleo" ON public.user_profiles_familia FOR SELECT USING (
    family_id = get_my_family_id() OR is_admin()
);

CREATE POLICY "Inserção de perfil" ON public.user_profiles_familia FOR INSERT WITH CHECK (
    auth.uid() = user_id OR is_admin()
);

CREATE POLICY "Update de perfil" ON public.user_profiles_familia FOR UPDATE USING (
    auth.uid() = user_id OR is_admin()
);

-- 8. POLÍTICAS tasks_familia
CREATE POLICY "Ver tarefas do próprio núcleo" ON public.tasks_familia FOR SELECT USING (
    family_id = get_my_family_id() OR is_admin()
);

CREATE POLICY "Criar tarefas no próprio núcleo" ON public.tasks_familia FOR INSERT WITH CHECK (
    family_id = get_my_family_id()
);

CREATE POLICY "Editar tarefas do próprio núcleo" ON public.tasks_familia FOR UPDATE USING (
    family_id = get_my_family_id() OR is_admin()
);

CREATE POLICY "Remover tarefas do próprio núcleo" ON public.tasks_familia FOR DELETE USING (
    family_id = get_my_family_id() OR is_admin()
);

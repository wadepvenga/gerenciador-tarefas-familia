-- Migração para integração com Google Agenda
CREATE TABLE IF NOT EXISTS public.google_calendar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_id TEXT DEFAULT 'primary',
    sync_enabled BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Usuários podem ver suas próprias configurações" 
ON public.google_calendar_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações" 
ON public.google_calendar_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações" 
ON public.google_calendar_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias configurações" 
ON public.google_calendar_settings FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_calendar_settings_updated_at
    BEFORE UPDATE ON public.google_calendar_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

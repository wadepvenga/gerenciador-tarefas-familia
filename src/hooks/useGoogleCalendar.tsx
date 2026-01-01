import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from './use-toast';

export interface GoogleCalendarSettings {
    calendar_id: string;
    sync_enabled: boolean;
}

export const useGoogleCalendar = () => {
    const { currentUser, session } = useSupabaseAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchSettings();
            checkConnection();
        }
    }, [currentUser]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await (supabase
                .from('google_calendar_settings' as any) as any)
                .select('*')
                .eq('user_id', currentUser?.user_id)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSettings({
                    calendar_id: (data as any).calendar_id,
                    sync_enabled: (data as any).sync_enabled,
                    last_sync_at: (data as any).last_sync_at,
                });
            }
        } catch (error) {
            console.error('Error fetching calendar settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncTasks = async () => {
        if (!isConnected || !settings) return;

        try {
            const token = session?.provider_token;
            if (!token) throw new Error('Não autenticado com o Google');

            // Buscar tarefas atribuídas ao usuário que tenham data de vencimento
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks_familia' as any)
                .select('*')
                .contains('assigned_users', [currentUser?.user_id]);

            if (tasksError) throw tasksError;

            let syncedCount = 0;
            for (const task of (tasks || [])) {
                if (!task.due_date) continue;

                const event = {
                    summary: `👨‍👩‍👧‍👦 ${task.title}`,
                    description: task.description || '',
                    start: {
                        dateTime: task.due_date,
                    },
                    end: {
                        dateTime: task.due_date, // Tarefas são eventos pontuais por padrão
                    },
                };

                const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${settings.calendar_id}/events`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });

                if (response.ok) {
                    syncedCount++;
                }
            }

            // Atualizar última sincronização
            await (supabase
                .from('google_calendar_settings' as any) as any)
                .update({ last_sync_at: new Date().toISOString() })
                .eq('user_id', currentUser?.user_id);

            setSettings(prev => prev ? { ...prev, last_sync_at: new Date().toISOString() } : null);

            toast({
                title: 'Sincronização concluída',
                description: `${syncedCount} tarefas foram enviadas para o seu Google Agenda.`,
            });
        } catch (error: any) {
            console.error('Error syncing tasks:', error);
            toast({
                title: 'Erro na sincronização',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const checkConnection = () => {
        // Supabase stores provider tokens in the session
        const providerToken = session?.provider_token;
        setIsConnected(!!providerToken);
    };

    const connect = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
                    redirectTo: window.location.origin,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            toast({
                title: 'Erro ao conectar',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const updateSettings = async (newSettings: Partial<GoogleCalendarSettings>) => {
        try {
            const { error } = await (supabase
                .from('google_calendar_settings' as any) as any)
                .upsert({
                    user_id: currentUser?.user_id,
                    ...settings,
                    ...newSettings,
                });

            if (error) throw error;

            setSettings(prev => prev ? { ...prev, ...newSettings } : (newSettings as GoogleCalendarSettings));

            toast({
                title: 'Configurações salvas',
                description: 'Suas preferências do Google Agenda foram atualizadas.',
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    return {
        settings,
        loading,
        isConnected,
        connect,
        updateSettings,
        syncTasks,
        session,
    };
};

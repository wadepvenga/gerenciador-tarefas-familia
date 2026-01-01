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
                });
            }
        } catch (error) {
            console.error('Error fetching calendar settings:', error);
        } finally {
            setLoading(false);
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
                    scopes: 'https://www.googleapis.com/calendar/v3/users/me/calendarList https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
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
    };
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const GoogleCalendarConfig = () => {
    const { isConnected, connect, settings, updateSettings, loading, syncTasks } = useGoogleCalendar();
    const { session } = useSupabaseAuth();
    const [calendars, setCalendars] = useState<{ id: string; summary: string }[]>([]);
    const [fetchingCalendars, setFetchingCalendars] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (isConnected) {
            fetchUserCalendars();
        }
    }, [isConnected]);

    const handleManualSync = async () => {
        setIsSyncing(true);
        await syncTasks();
        setIsSyncing(false);
    };

    const fetchUserCalendars = async () => {
        setFetchingCalendars(true);
        try {
            // In a real scenario, we'd call a Supabase Edge Function or a direct API call if we have the token
            // Since we're in the frontend, we'll use the provider token from the session
            const token = session?.provider_token;

            if (!token) {
                console.error('No provider token found');
                return;
            }

            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCalendars(data.items.map((item: any) => ({
                    id: item.id,
                    summary: item.summary
                })));
            } else {
                console.error('Failed to fetch calendars', await response.text());
            }
        } catch (error) {
            console.error('Error fetching calendars:', error);
        } finally {
            setFetchingCalendars(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-primary" />
                                Google Agenda
                            </CardTitle>
                            <CardDescription>
                                Sincronize suas tarefas da família com seu calendário pessoal do Google.
                            </CardDescription>
                        </div>
                        {isConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Conectado
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-sm font-medium border border-amber-500/20">
                                <AlertCircle className="w-4 h-4" />
                                Não conectado
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isConnected ? (
                        <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Conecte sua conta do Google para começar a sincronizar suas tarefas.
                            </p>
                            <Button onClick={connect} className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Conectar com Google
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="sync-toggle">Sincronização Ativa</Label>
                                        <p className="text-sm text-muted-foreground">
                                            As novas tarefas serão adicionadas automaticamente ao seu calendário.
                                        </p>
                                    </div>
                                    <Switch
                                        id="sync-toggle"
                                        checked={settings?.sync_enabled ?? false}
                                        onCheckedChange={(checked) => updateSettings({ sync_enabled: checked })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Selecione o Calendário</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={settings?.calendar_id || 'primary'}
                                            onValueChange={(value) => updateSettings({ calendar_id: value })}
                                            disabled={fetchingCalendars}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione um calendário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="primary">Calendário Principal</SelectItem>
                                                {calendars.filter(c => c.id !== 'primary').map((cal) => (
                                                    <SelectItem key={cal.id} value={cal.id}>
                                                        {cal.summary}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={fetchUserCalendars}
                                            disabled={fetchingCalendars}
                                        >
                                            <RefreshCw className={`w-4 h-4 ${fetchingCalendars ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <Button
                                    variant="secondary"
                                    className="w-full gap-2"
                                    onClick={handleManualSync}
                                    disabled={isSyncing}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Sincronizando...' : 'Sincronizar tarefas existentes (Manual)'}
                                </Button>
                                {settings?.last_sync_at && (
                                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                                        Última sincronização: {new Date(settings.last_sync_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="py-4">
                    <CardTitle className="text-sm">Nota de Segurança</CardTitle>
                    <CardDescription className="text-xs">
                        Nós apenas solicitamos permissão para ver seus calendários e criar eventos.
                        Não acessamos seus contatos ou outros dados pessoais da conta Google.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};

export default GoogleCalendarConfig;

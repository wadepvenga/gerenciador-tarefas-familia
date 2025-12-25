import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Home, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FamilyNucleus } from '@/types/user';

const NucleiManagement: React.FC = () => {
    const [nuclei, setNuclei] = useState<FamilyNucleus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const { toast } = useToast();

    const loadNuclei = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('family_nuclei')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setNuclei((Array.isArray(data) ? data : []).map(item => ({
                ...item,
                created_at: new Date(item.created_at)
            })));
        } catch (error: any) {
            console.error('Erro ao carregar núcleos:', error);

            // 42P01: Tabela não existe
            if (error.code === '42P01') {
                toast({
                    title: "Configuração Necessária",
                    description: "⚠️ A tabela 'family_nuclei' não foi encontrada. Clique no SQL Editor do Supabase e execute o script '20251225000000_create_family_nuclei.sql'.",
                    variant: "destructive",
                    duration: 15000
                });
            } else {
                toast({
                    title: "Erro ao carregar núcleos",
                    description: error.message,
                    variant: "destructive"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadNuclei();
    }, []);

    const handleCreateNucleus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsCreating(true);
        try {
            const { error } = await supabase
                .from('family_nuclei')
                .insert({
                    name: newName,
                    description: newDescription
                });

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: `Núcleo "${newName}" criado com sucesso.`,
            });

            setNewName('');
            setNewDescription('');
            await loadNuclei();
        } catch (error: any) {
            toast({
                title: "Erro ao criar núcleo",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteNucleus = async (id: string, name: string) => {
        const isVengaFamily = name.toLowerCase().includes('venga');
        if (isVengaFamily) {
            toast({
                title: "Ação não permitida",
                description: "O núcleo 'Família Venga' é o núcleo principal e não pode ser excluído.",
                variant: "destructive"
            });
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o núcleo "${name}"? Isso pode afetar usuários vinculados.`)) {
            try {
                const { error } = await supabase
                    .from('family_nuclei')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                toast({
                    title: "Núcleo removido",
                    description: "O núcleo foi excluído com sucesso.",
                });
                await loadNuclei();
            } catch (error: any) {
                toast({
                    title: "Erro ao remover núcleo",
                    description: error.message,
                    variant: "destructive"
                });
            }
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card backdrop-blur-sm border border-border dark:bg-slate-800/50 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Núcleo Familiar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateNucleus} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nucleus-name">Nome da Família</Label>
                            <Input
                                id="nucleus-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: Família Silva"
                                className="bg-muted border-border"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nucleus-desc">Descrição (Opcional)</Label>
                            <Input
                                id="nucleus-desc"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Ex: Núcleo do irmão"
                                className="bg-muted border-border"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="submit"
                                disabled={isCreating}
                                className="w-full bg-primary text-primary-foreground hover:opacity-90"
                            >
                                {isCreating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar Núcleo
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-card backdrop-blur-sm border border-border dark:bg-slate-800/50 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground">Núcleos Cadastrados</CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadNuclei} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nuclei.length === 0 && !isLoading && (
                            <div className="col-span-full p-8 text-center border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">Nenhum núcleo encontrado.</p>
                                <p className="text-xs text-amber-500 mt-2">
                                    Se você acabou de baixar a atualização, certifique-se de executar o script SQL de migração no Supabase Dashboard.
                                </p>
                            </div>
                        )}
                        {(Array.isArray(nuclei) ? nuclei : []).map((nucleus) => (
                            <div
                                key={nucleus.id}
                                className="p-4 rounded-xl border border-border bg-muted/30 flex justify-between items-start group hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                        <Home className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{nucleus.name}</h3>
                                        <p className="text-xs text-muted-foreground">{nucleus.description || 'Sem descrição'}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteNucleus(nucleus.id, nucleus.name)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NucleiManagement;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Users, Plus, Crown, Shield, User as UserIcon, UserX, Mail, CheckCircle, Clock, RefreshCw, Trash2, UserMinus, Eye, EyeOff, GraduationCap, UserCheck, FileText, UserCog, Edit, UserPlus, ShieldCheck } from 'lucide-react';
import { User } from '@/types/user';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import PasswordManagement from './PasswordManagement';
import { supabase } from '@/integrations/supabase/client';

const UserManagement: React.FC = () => {
  const [confirmedUsers, setConfirmedUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'pai' as User['role'],
    family_id: '',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'pai' as User['role'],
    family_id: '',
  });
  const [nuclei, setNuclei] = useState<any[]>([]);

  const {
    canAccessUserManagement,
    createUser,
    updateUser,
    getAllUsers,
    refreshProfile,
    changePassword,
    deleteUser,
    toggleUserStatus,
    currentUser
  } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadNuclei();
  }, []);

  const loadNuclei = async () => {
    try {
      const { data, error } = await supabase.from('family_nuclei').select('*').order('name');
      if (error) throw error;
      setNuclei(data || []);
    } catch (error) {
      console.error('Erro ao carregar núcleos no UserManagement:', error);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // ✅ CARREGAR TODOS OS USUÁRIOS (ATIVOS E INATIVOS) para gerenciamento
      const { data, error } = await supabase
        .from('user_profiles_familia')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive"
        });
        return;
      }

      const users = (Array.isArray(data) ? data : []).map((user: any) => ({
        id: user.id as string,
        user_id: user.user_id as string,
        name: user.name as string,
        email: user.email as string,
        role: user.role as User['role'],
        is_active: user.is_active as boolean,
        password_hash: user.password_hash as string,
        created_at: new Date(user.created_at as string),
        last_login: user.last_login ? new Date(user.last_login as string) : undefined,
        first_login_completed: (user as any).first_login_completed as boolean,
        family_id: user.family_id as string
      }));

      setConfirmedUsers(users);
      console.log('Usuários carregados no UserManagement:', users.length);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccessUserManagement()) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'franqueado': return 'bg-blue-500/20 text-blue-400';
      case 'pai': return 'bg-indigo-500/20 text-indigo-400';
      case 'mae': return 'bg-pink-500/20 text-pink-400';
      case 'esposo': return 'bg-indigo-500/20 text-indigo-400';
      case 'esposa': return 'bg-pink-500/20 text-pink-400';
      case 'avo_homem': return 'bg-amber-500/20 text-amber-400';
      case 'avo_mulher': return 'bg-orange-500/20 text-orange-400';
      case 'filho': return 'bg-green-500/20 text-green-400';
      case 'filha': return 'bg-purple-500/20 text-purple-400';
      case 'outro': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Admin</Badge>;
      case 'franqueado':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Franqueado</Badge>;
      case 'pai':
        return <Badge className="bg-indigo-600 hover:bg-indigo-700">Pai</Badge>;
      case 'mae':
        return <Badge className="bg-pink-500 hover:bg-pink-600">Mãe</Badge>;
      case 'esposo':
        return <Badge className="bg-indigo-600 hover:bg-indigo-700">Esposo</Badge>;
      case 'esposa':
        return <Badge className="bg-pink-500 hover:bg-pink-600">Esposa</Badge>;
      case 'avo_homem':
        return <Badge className="bg-amber-600 hover:bg-amber-700">Avô</Badge>;
      case 'avo_mulher':
        return <Badge className="bg-orange-600 hover:bg-orange-700">Avó</Badge>;
      case 'filho':
        return <Badge className="bg-green-500 hover:bg-green-600">Filho</Badge>;
      case 'filha':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Filha</Badge>;
      case 'outro':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Outro</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getRoleOptions = () => {
    return [
      { value: 'admin', label: 'Administrador / Responsável' },
      { value: 'pai', label: 'Pai' },
      { value: 'mae', label: 'Mãe' },
      { value: 'esposo', label: 'Esposo' },
      { value: 'esposa', label: 'Esposa' },
      { value: 'avo_homem', label: 'Avô' },
      { value: 'avo_mulher', label: 'Avó' },
      { value: 'filho', label: 'Filho' },
      { value: 'filha', label: 'Filha' },
      { value: 'outro', label: 'Outro Familiar' },
    ];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      case 'pai':
      case 'mae':
      case 'esposo':
      case 'esposa':
      case 'avo_homem':
      case 'avo_mulher':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'filho':
      case 'filha':
        return <UserIcon className="w-4 h-4 text-green-400" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador / Responsável';
      case 'pai': return 'Pai';
      case 'mae': return 'Mãe';
      case 'esposo': return 'Esposo';
      case 'esposa': return 'Esposa';
      case 'avo_homem': return 'Avô';
      case 'avo_mulher': return 'Avó';
      case 'filho': return 'Filho';
      case 'filha': return 'Filha';
      case 'outro': return 'Outro Familiar';
      default: return role;
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        family_id: newUser.family_id
      };

      const success = await createUser(userData);
      if (success) {
        setNewUser({
          name: '',
          email: '',
          role: 'pai',
          family_id: '',
        });
        setIsAddDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao criar usuário no componente:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      family_id: user.family_id || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editUser.name || !editUser.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const userData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role
      };

      const success = await updateUser(editingUser.id, userData);
      if (success) {
        setEditUser({
          name: '',
          email: '',
          role: 'pai',
          family_id: '',
        });
        setEditingUser(null);
        setIsEditDialogOpen(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Tem certeza que deseja remover o acesso de "${userName}" a este sistema da Família Venga? 

Esta ação NÃO excluirá a conta dele no sistema da Rockfeller, mas ele não poderá mais ver as tarefas da família.`)) {
      try {
        const success = await deleteUser(userId);
        if (success) {
          toast({
            title: "Usuário Excluído",
            description: `${userName} foi excluído com sucesso`,
          });
          await loadUsers();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, userName: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode alterar o status da sua própria conta",
        variant: "destructive"
      });
      return;
    }

    const action = currentStatus ? 'desativar' : 'ativar';
    if (confirm(`Tem certeza que deseja ${action} o usuário "${userName}"?`)) {
      try {
        const success = await toggleUserStatus(userId);
        if (success) {
          toast({
            title: "Status Alterado",
            description: `${userName} foi ${action} com sucesso`,
          });
          await loadUsers();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao alterar status do usuário",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card backdrop-blur-sm border border-border dark:bg-slate-800/50 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-foreground text-lg dark:text-white">Usuários Ativos</CardTitle>
                <p className="text-muted-foreground text-sm dark:text-slate-400">Usuários confirmados no sistema</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={loadUsers}
                disabled={isLoading}
                variant="outline"
                className="bg-muted border-border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto dark:bg-slate-700/50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600/50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </>
                )}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border dark:bg-slate-800 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">Criar Novo Usuário</DialogTitle>
                    <DialogDescription className="sr-only">Preencha os dados abaixo para criar um novo usuário no sistema.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userName" className="text-muted-foreground dark:text-slate-300">Nome *</Label>
                      <Input
                        id="userName"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-muted border-border text-foreground dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                        placeholder="Nome completo do usuário"
                        disabled={isCreating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="userEmail" className="text-muted-foreground dark:text-slate-300">Email *</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-muted border-border text-foreground dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                        placeholder="email@exemplo.com"
                        disabled={isCreating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="userRole" className="text-muted-foreground dark:text-slate-300">Papel</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}
                        disabled={isCreating}
                      >
                        <SelectTrigger className="bg-muted border-border dark:bg-slate-700/50 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border dark:bg-slate-800 dark:border-slate-700">
                          {getRoleOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="userFamily" className="text-muted-foreground dark:text-slate-300">Núcleo Familiar *</Label>
                      <Select
                        value={newUser.family_id}
                        onValueChange={(value: any) => setNewUser(prev => ({ ...prev, family_id: value }))}
                        disabled={isCreating}
                        required
                      >
                        <SelectTrigger className="bg-muted border-border dark:bg-slate-700/50 dark:border-slate-600">
                          <SelectValue placeholder="Selecione uma família" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border dark:bg-slate-800 dark:border-slate-700">
                          {(nuclei || []).map(n => (
                            <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleCreateUser}
                      disabled={isCreating}
                      className="w-full bg-primary text-primary-foreground hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Usuário
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(confirmedUsers) ? confirmedUsers : []).map(user => (
              <div key={user.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-4 ${user.is_active === false
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-muted/40 border-border dark:bg-slate-700/30 dark:border-slate-600'
                }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${user.is_active === false ? 'bg-red-500/20' : 'bg-muted dark:bg-slate-600/50'
                    }`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium truncate ${user.is_active === false ? 'text-red-300 line-through' : 'text-foreground dark:text-white'
                        }`}>
                        {user.name}
                      </h4>
                      {user.is_active === false && (
                        <Badge className="bg-red-500/20 text-red-400">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Badge className={`${getRoleColor(user.role)} whitespace-nowrap`}>
                    {getRoleLabel(user.role)}
                  </Badge>

                  {user.id !== currentUser?.id && (
                    <div className="flex flex-wrap gap-2">
                      <PasswordManagement userId={user.id} userName={user.name} />

                      <Button
                        onClick={() => handleEditUser(user)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-blue-600 text-white hover:opacity-90 dark:bg-blue-500/20 dark:border-blue-500/30 dark:hover:bg-blue-500/30 dark:text-blue-400"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>

                      <Button
                        onClick={() => handleToggleUserStatus(user.id, user.name, user.is_active)}
                        variant="outline"
                        size="sm"
                        className={`text-xs ${user.is_active
                          ? "bg-yellow-500 text-black hover:opacity-90 dark:bg-yellow-500/20 dark:border-yellow-500/30 dark:hover:bg-yellow-500/30 dark:text-yellow-400"
                          : "bg-green-600 text-white hover:opacity-90 dark:bg-green-500/20 dark:border-green-500/30 dark:hover:bg-green-500/30 dark:text-green-400"
                          }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-red-600 text-white hover:opacity-90 dark:bg-red-500/20 dark:border-red-500/30 dark:hover:bg-red-500/30 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  )}

                  {user.last_login && (
                    <span className="text-xs text-muted-foreground dark:text-slate-400">
                      Último acesso: {user.last_login.toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {confirmedUsers.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum usuário ativo</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-400">Carregando usuários...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Usuário</DialogTitle>
            <DialogDescription className="sr-only">Altere os dados do usuário abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editUserName" className="text-slate-300">Nome *</Label>
              <Input
                id="editUserName"
                value={editUser.name}
                onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Nome completo do usuário"
                disabled={isUpdating}
              />
            </div>

            <div>
              <Label htmlFor="editUserEmail" className="text-slate-300">Email *</Label>
              <Input
                id="editUserEmail"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="email@exemplo.com"
                disabled={isUpdating}
              />
            </div>

            <div>
              <Label htmlFor="editUserRole" className="text-slate-300">Papel</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: any) => setEditUser(prev => ({ ...prev, role: value }))}
                disabled={isUpdating}
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {getRoleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editUserFamily" className="text-slate-300">Núcleo Familiar *</Label>
              <Select
                value={editUser.family_id}
                onValueChange={(value: any) => setEditUser(prev => ({ ...prev, family_id: value }))}
                disabled={isUpdating}
                required
              >
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione uma família" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(nuclei || []).map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>

              <Button
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
                variant="outline"
                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

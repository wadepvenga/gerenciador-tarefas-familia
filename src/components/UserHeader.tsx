import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, Shield, User, GraduationCap, UserCheck, FileText, UserCog } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import NotificationCenter from './NotificationCenter';
import Logo from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const UserHeader: React.FC = () => {
  const { currentUser, logout } = useSupabaseAuth();

  if (!currentUser) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'pai':
      case 'mae': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'filho':
      case 'filha': return <User className="w-4 h-4 text-purple-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500/20 text-yellow-400';
      case 'pai': return 'bg-blue-500/20 text-blue-400';
      case 'mae': return 'bg-pink-500/20 text-pink-400';
      case 'filho': return 'bg-purple-500/20 text-purple-400';
      case 'filha': return 'bg-indigo-500/20 text-indigo-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'pai': return 'Pai';
      case 'mae': return 'Mãe';
      case 'filho': return 'Filho';
      case 'filha': return 'Filha';
      case 'outro': return 'Outro';
      default: return role;
    }
  };

  return (
    <Card className="mb-6 border bg-card backdrop-blur-md shadow-xl dark:bg-slate-900/40 dark:border-slate-800">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Logo and Title - Hidden text on mobile */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Logo size="xs" variant="icon" />
            <div className="hidden md:block">
              <h1 className="text-2xl font-black text-foreground tracking-tighter">
                FAMÍLIA VENGA
              </h1>
              <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
                Gestão de Tarefas
              </p>
            </div>
          </div>

          {/* Action Buttons - Compact on mobile */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:block font-medium text-primary-foreground dark:text-white max-w-[220px] truncate">
              {currentUser.name}
            </span>
            <ThemeToggle />
            <NotificationCenter />

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 dark:bg-slate-700/50 dark:border-slate-600 dark:hover:bg-slate-600/50 dark:text-white min-h-[44px]"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserHeader;

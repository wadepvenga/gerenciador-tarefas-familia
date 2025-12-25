import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut, Bell, Shield, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import UserManagement from '@/components/UserManagement';
import TaskManager from '@/components/TaskManager';
import UserHeader from '@/components/UserHeader';
import NotificationTestPanel from '@/components/NotificationTestPanel';
import NucleiManagement from '@/components/NucleiManagement';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const { currentUser, logout, canAccessUserManagement } = useSupabaseAuth();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };

  // Pull-to-refresh functionality
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === 0) return;
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;

      if (distance > 0 && container.scrollTop === 0) {
        setPullDistance(Math.min(distance, 120));
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80) {
        setIsPullRefreshing(true);
        setPullDistance(0);
        touchStartY.current = 0;

        // Refresh page
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
      } else {
        setPullDistance(0);
        touchStartY.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

  if (!currentUser) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen w-full bg-background text-foreground overflow-auto pb-20 md:pb-6"
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 transition-all"
          style={{
            height: `${pullDistance}px`,
            opacity: pullDistance / 120
          }}
        >
          <RefreshCw
            className={`w-6 h-6 text-primary ${pullDistance > 80 ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <UserHeader />

        <div className="mb-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop: Top navigation */}
          <TabsList className="hidden md:grid w-full grid-cols-4 bg-muted border border-border">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            {canAccessUserManagement() && (
              <>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger
                  value="nuclei"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Núcleos
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Mobile: Bottom navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40 safe-area-inset-bottom">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent border-0 rounded-none">
              <TabsTrigger
                value="tasks"
                className="flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-xs">Tarefas</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full"
              >
                <Bell className="w-6 h-6" />
                <span className="text-xs">Notific.</span>
              </TabsTrigger>
              {canAccessUserManagement() && (
                <>
                  <TabsTrigger
                    value="users"
                    className="flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full"
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-xs">Usuários</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="nuclei"
                    className="flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full"
                  >
                    <Shield className="w-6 h-6" />
                    <span className="text-xs">Núcleos</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManager />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationTestPanel />
          </TabsContent>

          {canAccessUserManagement() && (
            <>
              <TabsContent value="users" className="space-y-6">
                <Card className="bg-card backdrop-blur-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Gerenciar Usuários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="nuclei" className="space-y-6">
                <Card className="bg-card backdrop-blur-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Núcleos Familiares
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <NucleiManagement />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

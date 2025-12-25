
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useSupabaseAuth();

  useEffect(() => {
    if (currentUser) {
      loadUserProfiles();
    }
  }, [currentUser]);

  const loadUserProfiles = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_profiles_familia')
        .select('user_id, name, email, role, family_id');

      // ✅ ISOLAÇÃO: Filtrar perfis pelo mesmo núcleo do usuário atual
      if (currentUser?.family_id) {
        query = query.eq('family_id', currentUser.family_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar perfis de usuários:', error);
        return;
      }

      if (data) {
        const profilesMap = data.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, UserProfile>);

        setUserProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis de usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string): string => {
    return userProfiles[userId]?.name || 'Usuário não encontrado';
  };

  const getUsersByIds = (userIds: string[]): UserProfile[] => {
    if (!userIds || !Array.isArray(userIds)) return [];
    return userIds.map(id => userProfiles[id]).filter(Boolean);
  };

  return {
    userProfiles,
    isLoading,
    getUserName,
    getUsersByIds,
    loadUserProfiles
  };
};

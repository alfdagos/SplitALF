import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesService } from '@/services/profiles.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: () => profilesService.getProfile(user!.id),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (name: string) => {
      if (!user) throw new Error('Utente non autenticato');
      return profilesService.updateName(user.id, name);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile(user.id),
        });
      }
    },
  });
}

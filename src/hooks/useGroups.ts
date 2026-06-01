import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '@/services/groups.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from './useAuth';

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups(),
    queryFn: () => groupsService.listGroups(),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => groupsService.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (name: string) => {
      if (!user) throw new Error('Utente non autenticato');
      return groupsService.createGroup(name, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}

export function useRenameGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => groupsService.renameGroup(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}

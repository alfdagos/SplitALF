import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { queryKeys } from '@/lib/query-keys';

export function useMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.members(groupId),
    queryFn: () => membersService.listMembers(groupId),
    enabled: !!groupId,
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => membersService.addByEmail(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      membersService.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    },
  });
}

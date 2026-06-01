import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expensesService,
  type CreateExpenseParams,
} from '@/services/expenses.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from './useAuth';

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: queryKeys.expenses(groupId),
    queryFn: () => expensesService.listGroupExpenses(groupId),
    enabled: !!groupId,
  });
}

export function useRecentExpenses(limit = 5) {
  return useQuery({
    queryKey: queryKeys.recentExpenses(),
    queryFn: () => expensesService.listRecentForUser(limit),
  });
}

export function useUserTotals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.userTotals(user?.id ?? ''),
    queryFn: () => expensesService.getUserTotals(user!.id),
    enabled: !!user,
  });
}

/** Invalida tutte le query impattate dalla modifica di una spesa. */
function invalidateExpenseQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId: string,
  userId?: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses(groupId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.recentExpenses() });
  if (userId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.userTotals(userId) });
  }
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (params: CreateExpenseParams) => expensesService.create(params),
    onSuccess: (_id, params) =>
      invalidateExpenseQueries(queryClient, params.groupId, user?.id),
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (expenseId: string) => expensesService.remove(expenseId),
    onSuccess: () => invalidateExpenseQueries(queryClient, groupId, user?.id),
  });
}

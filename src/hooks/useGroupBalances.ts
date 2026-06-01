import { useMemo } from 'react';
import { useMembers } from './useMembers';
import { useGroupExpenses } from './useExpenses';
import { computeBalances, minimizeTransfers } from '@/lib/settle';
import type { MemberBalance, Settlement } from '@/types';

export interface GroupBalances {
  balances: MemberBalance[];
  settlements: Settlement[];
  totalSpent: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Combina membri e spese di un gruppo e ne deriva saldi, trasferimenti
 * consigliati e totale speso. Il calcolo è memoizzato.
 */
export function useGroupBalances(groupId: string): GroupBalances {
  const membersQuery = useMembers(groupId);
  const expensesQuery = useGroupExpenses(groupId);

  const members = membersQuery.data;
  const expenses = expensesQuery.data;

  return useMemo(() => {
    const balances =
      members && expenses ? computeBalances(members, expenses) : [];
    const settlements = balances.length ? minimizeTransfers(balances) : [];
    const totalSpent = (expenses ?? []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      balances,
      settlements,
      totalSpent: Math.round(totalSpent * 100) / 100,
      isLoading: membersQuery.isLoading || expensesQuery.isLoading,
      isError: membersQuery.isError || expensesQuery.isError,
    };
  }, [
    members,
    expenses,
    membersQuery.isLoading,
    membersQuery.isError,
    expensesQuery.isLoading,
    expensesQuery.isError,
  ]);
}

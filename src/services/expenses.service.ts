import { supabase } from '@/lib/supabase';
import type { ExpenseWithDetails } from '@/types';
import type { Json } from '@/types/database.types';

export interface ShareInput {
  user_id: string;
  amount_due: number;
}

export interface CreateExpenseParams {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  expenseDate: string;
  shares: ShareInput[];
}

/** Spesa recente con il nome del gruppo, usata nella dashboard. */
export interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  group: { id: string; name: string };
  payer: { id: string; name: string };
}

const EXPENSE_SELECT =
  '*, payer:profiles!expenses_paid_by_fkey(id, name, email), shares:expense_shares(*)';

export const expensesService = {
  /** Tutte le spese di un gruppo, con pagatore e quote, dalla più recente. */
  async listGroupExpenses(groupId: string): Promise<ExpenseWithDetails[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ExpenseWithDetails[];
  },

  /** Ultime spese dell'utente su tutti i suoi gruppi (per la dashboard). */
  async listRecentForUser(limit = 5): Promise<RecentExpense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(
        'id, description, amount, expense_date, group:groups!expenses_group_id_fkey(id, name), payer:profiles!expenses_paid_by_fkey(id, name)',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as RecentExpense[];
  },

  /** Crea spesa + quote atomicamente tramite RPC. */
  async create(params: CreateExpenseParams): Promise<string> {
    const { data, error } = await supabase.rpc('create_expense_with_shares', {
      _group_id: params.groupId,
      _description: params.description,
      _amount: params.amount,
      _paid_by: params.paidBy,
      _expense_date: params.expenseDate,
      _shares: params.shares as unknown as Json,
    });
    if (error) throw error;
    return data as string;
  },

  async remove(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    if (error) throw error;
  },

  /** Totali globali dell'utente: quanto ha pagato e quanto deve, ovunque. */
  async getUserTotals(
    userId: string,
  ): Promise<{ paid: number; owed: number; net: number }> {
    const [paidRes, owedRes] = await Promise.all([
      supabase.from('expenses').select('amount').eq('paid_by', userId),
      supabase
        .from('expense_shares')
        .select('amount_due')
        .eq('user_id', userId),
    ]);
    if (paidRes.error) throw paidRes.error;
    if (owedRes.error) throw owedRes.error;

    const paid = (paidRes.data ?? []).reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    const owed = (owedRes.data ?? []).reduce(
      (sum, r) => sum + Number(r.amount_due),
      0,
    );
    return {
      paid: Math.round(paid * 100) / 100,
      owed: Math.round(owed * 100) / 100,
      net: Math.round((paid - owed) * 100) / 100,
    };
  },
};

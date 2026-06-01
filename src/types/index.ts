/**
 * Tipi di dominio dell'applicazione, derivati dallo schema del database
 * e arricchiti con le relazioni usate dalla UI.
 */
import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseShare =
  Database['public']['Tables']['expense_shares']['Row'];

/** Membro di un gruppo con i dati del profilo associato. */
export interface MemberWithProfile {
  user_id: string;
  joined_at: string;
  profile: Profile;
}

/** Gruppo arricchito con conteggio membri e ruolo dell'utente corrente. */
export interface GroupWithMeta extends Group {
  memberCount: number;
}

/** Spesa con il profilo del pagatore e le relative quote. */
export interface ExpenseWithDetails extends Expense {
  payer: Pick<Profile, 'id' | 'name' | 'email'>;
  shares: ExpenseShare[];
}

/** Saldo netto di un membro: positivo = deve ricevere, negativo = deve pagare. */
export interface MemberBalance {
  userId: string;
  name: string;
  email: string;
  paid: number;
  owed: number;
  net: number;
}

/** Trasferimento consigliato dall'algoritmo di minimizzazione. */
export interface Settlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

/** Tipo di divisione di una spesa. */
export type SplitMode = 'equal' | 'custom';

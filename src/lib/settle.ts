/**
 * Logica di calcolo dei saldi e minimizzazione dei trasferimenti.
 *
 * - computeBalances: dato l'elenco delle spese e delle quote, calcola il saldo
 *   netto di ogni membro (quanto ha pagato - quanto deve).
 * - minimizeTransfers: algoritmo greedy che riduce al minimo il numero di
 *   bonifici necessari per saldare tutti i debiti.
 * - splitEqual: divide un importo in N quote uguali distribuendo i centesimi
 *   di resto, così che la somma delle quote sia esattamente pari all'importo.
 */
import type {
  ExpenseWithDetails,
  MemberBalance,
  MemberWithProfile,
  Settlement,
} from '@/types';
import { round2 } from './utils';

/**
 * Divide `amount` tra `count` persone in quote uguali (2 decimali),
 * assegnando i centesimi residui alle prime quote. La somma è esatta.
 *
 * Esempio: splitEqual(100, 3) -> [33.34, 33.33, 33.33]
 */
export function splitEqual(amount: number, count: number): number[] {
  if (count <= 0) return [];
  const totalCents = Math.round(amount * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  return Array.from({ length: count }, (_, i) => {
    const cents = base + (i < remainder ? 1 : 0);
    return cents / 100;
  });
}

/**
 * Calcola il saldo netto di ciascun membro del gruppo.
 * net > 0  => l'utente deve ricevere denaro (è creditore)
 * net < 0  => l'utente deve pagare (è debitore)
 */
export function computeBalances(
  members: MemberWithProfile[],
  expenses: ExpenseWithDetails[],
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();

  for (const member of members) {
    balances.set(member.user_id, {
      userId: member.user_id,
      name: member.profile.name,
      email: member.profile.email,
      paid: 0,
      owed: 0,
      net: 0,
    });
  }

  for (const expense of expenses) {
    const payer = balances.get(expense.paid_by);
    if (payer) {
      payer.paid = round2(payer.paid + Number(expense.amount));
    }

    for (const share of expense.shares) {
      const debtor = balances.get(share.user_id);
      if (debtor) {
        debtor.owed = round2(debtor.owed + Number(share.amount_due));
      }
    }
  }

  for (const balance of balances.values()) {
    balance.net = round2(balance.paid - balance.owed);
  }

  return Array.from(balances.values());
}

/**
 * Minimizza il numero di trasferimenti necessari a saldare i debiti.
 *
 * Strategia greedy: a ogni passo si fa pagare il debitore con il debito
 * maggiore al creditore con il credito maggiore, per l'importo minimo tra i
 * due. Si ripete finché tutti i saldi non sono ~0.
 */
export function minimizeTransfers(balances: MemberBalance[]): Settlement[] {
  const EPS = 0.01;

  // Lavoriamo in centesimi (interi) per evitare derive di virgola mobile.
  const creditors = balances
    .filter((b) => b.net > EPS)
    .map((b) => ({ id: b.userId, name: b.name, cents: Math.round(b.net * 100) }));
  const debtors = balances
    .filter((b) => b.net < -EPS)
    .map((b) => ({ id: b.userId, name: b.name, cents: Math.round(-b.net * 100) }));

  // Ordine decrescente: il più grande in fondo (si estrae con pop()).
  creditors.sort((a, b) => a.cents - b.cents);
  debtors.sort((a, b) => a.cents - b.cents);

  const settlements: Settlement[] = [];

  let creditor = creditors.pop();
  let debtor = debtors.pop();

  while (creditor && debtor) {
    const transfer = Math.min(creditor.cents, debtor.cents);

    if (transfer > 0) {
      settlements.push({
        fromUserId: debtor.id,
        fromName: debtor.name,
        toUserId: creditor.id,
        toName: creditor.name,
        amount: transfer / 100,
      });
    }

    creditor.cents -= transfer;
    debtor.cents -= transfer;

    if (creditor.cents <= 0) creditor = creditors.pop();
    if (debtor.cents <= 0) debtor = debtors.pop();
  }

  return settlements;
}

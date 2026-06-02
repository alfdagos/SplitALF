import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Receipt, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupCard } from '@/components/groups/GroupCard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGroups } from '@/hooks/useGroups';
import { useRecentExpenses, useUserTotals } from '@/hooks/useExpenses';
import { formatCurrency, formatDate } from '@/lib/utils';

function SummaryCards() {
  const { data: totals, isLoading } = useUserTotals();

  if (isLoading || !totals) {
    return <Skeleton className="h-44 rounded-xl" />;
  }

  const isZero = Math.abs(totals.net) < 0.01;
  const positive = totals.net >= 0;
  const caption = isZero
    ? 'Sei in pari 🎉'
    : positive
      ? 'In totale devi ricevere'
      : 'In totale devi dare';

  return (
    <Card className="bg-ember glow-ember overflow-hidden border-0 text-white">
      <CardContent className="relative p-6 sm:p-8">
        {/* Aloni decorativi caldi */}
        <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/85">
              <Wallet className="h-4 w-4" />
              Saldo totale
            </p>
            <p className="mt-1.5 font-display text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
              {formatCurrency(totals.net)}
            </p>
            <span className="mt-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
              {caption}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/25 pt-5">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/75">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Hai pagato
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(totals.paid)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/75">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                La tua quota
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(totals.owed)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentExpensesCard() {
  const { data: expenses, isLoading } = useRecentExpenses(6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Ultime spese
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nessuna spesa registrata. Crea un gruppo e aggiungine una!
          </p>
        ) : (
          <ul className="divide-y">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    <Link
                      to={`/groups/${expense.group.id}`}
                      className="hover:underline"
                    >
                      {expense.group.name}
                    </Link>{' '}
                    · pagato da {expense.payer.name} ·{' '}
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <span className="ml-4 flex-shrink-0 font-semibold tabular-nums">
                  {formatCurrency(Number(expense.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function GroupsSection() {
  const { data: groups, isLoading } = useGroups();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nessun gruppo"
        description="Crea il tuo primo gruppo per iniziare a dividere le spese con amici, coinquilini o colleghi."
        action={<CreateGroupDialog />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        className="animate-rise"
        title="Dashboard"
        description="Una panoramica dei tuoi gruppi e dei tuoi saldi."
        actions={<CreateGroupDialog />}
      />

      <div className="animate-rise [animation-delay:90ms]">
        <SummaryCards />
      </div>

      <div className="animate-rise grid gap-6 [animation-delay:180ms] lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">I tuoi gruppi</h2>
          <GroupsSection />
        </section>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Attività recente</h2>
          <RecentExpensesCard />
        </section>
      </div>
    </div>
  );
}

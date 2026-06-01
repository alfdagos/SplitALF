import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Receipt, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { BalanceAmount } from '@/components/BalanceAmount';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupCard } from '@/components/groups/GroupCard';
import {
  Card,
  CardContent,
  CardDescription,
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
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            Saldo totale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BalanceAmount net={totals.net} showSign className="text-3xl" />
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.net >= 0
              ? 'In totale devi ricevere'
              : 'In totale devi dare'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <ArrowUpRight className="h-4 w-4 text-success" />
            Hai pagato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">
            {formatCurrency(totals.paid)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1.5">
            <ArrowDownLeft className="h-4 w-4 text-destructive" />
            La tua quota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">
            {formatCurrency(totals.owed)}
          </p>
        </CardContent>
      </Card>
    </div>
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
        title="Dashboard"
        description="Una panoramica dei tuoi gruppi e dei tuoi saldi."
        actions={<CreateGroupDialog />}
      />

      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
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

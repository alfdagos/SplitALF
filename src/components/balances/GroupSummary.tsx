import {
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceAmount } from '@/components/BalanceAmount';
import { UserAvatar } from '@/components/UserAvatar';
import { useGroupBalances } from '@/hooks/useGroupBalances';
import { formatCurrency } from '@/lib/utils';

export function GroupSummary({ groupId }: { groupId: string }) {
  const { balances, settlements, totalSpent, isLoading } =
    useGroupBalances(groupId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const creditors = balances
    .filter((b) => b.net > 0.01)
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .sort((a, b) => a.net - b.net);
  const settled = creditors.length === 0 && debtors.length === 0;

  return (
    <div className="space-y-6">
      <Card className="bg-ember glow-ember animate-rise overflow-hidden border-0 text-white">
        <CardContent className="relative p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <p className="relative flex items-center gap-1.5 text-sm font-medium text-white/85">
            <Wallet className="h-4 w-4" />
            Totale spese del gruppo
          </p>
          <p className="relative mt-1.5 font-display text-4xl font-extrabold tracking-tight tabular-nums">
            {formatCurrency(totalSpent)}
          </p>
        </CardContent>
      </Card>

      <div className="animate-rise grid gap-4 [animation-delay:90ms] md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" />
              Deve ricevere
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuno</p>
            ) : (
              <ul className="space-y-2">
                {creditors.map((b) => (
                  <li
                    key={b.userId}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <UserAvatar name={b.name} className="h-7 w-7 text-xs" />
                      {b.name}
                    </span>
                    <BalanceAmount net={b.net} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Deve pagare
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuno</p>
            ) : (
              <ul className="space-y-2">
                {debtors.map((b) => (
                  <li
                    key={b.userId}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <UserAvatar name={b.name} className="h-7 w-7 text-xs" />
                      {b.name}
                    </span>
                    <BalanceAmount net={b.net} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-rise [animation-delay:180ms]">
        <CardHeader>
          <CardTitle className="text-base">Trasferimenti consigliati</CardTitle>
          <CardDescription>
            Il numero minimo di pagamenti per saldare tutti i conti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settled ? (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Tutti i conti sono in pari! 🎉
              </span>
            </div>
          ) : (
            <ul className="space-y-2">
              {settlements.map((s, i) => (
                <li
                  key={`${s.fromUserId}-${s.toUserId}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3"
                >
                  <span className="font-medium">{s.fromName}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{s.toName}</span>
                  <span className="ml-auto font-semibold tabular-nums text-primary">
                    {formatCurrency(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

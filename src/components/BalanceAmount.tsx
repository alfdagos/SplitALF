import { cn, formatCurrency } from '@/lib/utils';

interface BalanceAmountProps {
  /** Saldo netto: >0 credito, <0 debito. */
  net: number;
  className?: string;
  /** Mostra il segno + davanti ai crediti. */
  showSign?: boolean;
}

/** Importo colorato in base al segno del saldo (verde credito, rosso debito). */
export function BalanceAmount({
  net,
  className,
  showSign = false,
}: BalanceAmountProps) {
  const isZero = Math.abs(net) < 0.01;
  const color = isZero
    ? 'text-muted-foreground'
    : net > 0
      ? 'text-success'
      : 'text-destructive';
  const prefix = showSign && !isZero && net > 0 ? '+' : '';

  return (
    <span className={cn('font-semibold tabular-nums', color, className)}>
      {prefix}
      {formatCurrency(net)}
    </span>
  );
}

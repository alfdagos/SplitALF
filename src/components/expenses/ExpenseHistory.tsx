import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useGroupExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import type { ExpenseWithDetails } from '@/types';

type SortField = 'expense_date' | 'amount' | 'description';
type SortDir = 'asc' | 'desc';

const SORT_ICON = {
  none: ArrowUpDown,
  asc: ArrowUp,
  desc: ArrowDown,
} as const;

export function ExpenseHistory({ groupId }: { groupId: string }) {
  const { data: expenses, isLoading } = useGroupExpenses(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('expense_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'description' ? 'asc' : 'desc');
    }
  };

  const hasFilters = search !== '' || from !== '' || to !== '';
  const clearFilters = () => {
    setSearch('');
    setFrom('');
    setTo('');
  };

  const filtered = useMemo(() => {
    let rows = [...(expenses ?? [])];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.payer.name.toLowerCase().includes(q),
      );
    }
    if (from) rows = rows.filter((e) => e.expense_date >= from);
    if (to) rows = rows.filter((e) => e.expense_date <= to);

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'amount') {
        cmp = Number(a.amount) - Number(b.amount);
      } else if (sortField === 'description') {
        cmp = a.description.localeCompare(b.description, 'it');
      } else {
        cmp = a.expense_date.localeCompare(b.expense_date);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [expenses, search, from, to, sortField, sortDir]);

  const handleDelete = async (expense: ExpenseWithDetails) => {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success('Spesa eliminata');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nessuna spesa"
        description="Aggiungi la prima spesa per iniziare a tenere i conti del gruppo."
      />
    );
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => {
    const Icon = SORT_ICON[sortField === field ? sortDir : 'none'];
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 font-medium hover:text-foreground"
      >
        {children}
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            sortField === field ? 'text-foreground' : 'text-muted-foreground/50',
          )}
        />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca per descrizione o pagatore…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Dal
            </label>
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Al
            </label>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              aria-label="Azzera filtri"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="description">Descrizione</SortButton>
              </TableHead>
              <TableHead>Pagato da</TableHead>
              <TableHead>
                <SortButton field="expense_date">Data</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="amount">Importo</SortButton>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nessuna spesa corrisponde ai filtri.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {expense.description}
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {expense.shares.length}{' '}
                        {expense.shares.length === 1 ? 'quota' : 'quote'}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell>{expense.payer.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(expense.expense_date)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(Number(expense.amount))}
                  </TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Elimina spesa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title="Eliminare la spesa?"
                      description={`"${expense.description}" verrà eliminata definitivamente insieme alle sue quote.`}
                      confirmLabel="Elimina"
                      destructive
                      onConfirm={() => handleDelete(expense)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

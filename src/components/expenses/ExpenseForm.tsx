import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/UserAvatar';
import { useCreateExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { splitEqual } from '@/lib/settle';
import { cn, formatCurrency, round2 } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { expenseSchema, type ExpenseInput } from '@/lib/validations';
import type { MemberWithProfile, SplitMode } from '@/types';
import type { ShareInput } from '@/services/expenses.service';

interface ExpenseFormProps {
  groupId: string;
  members: MemberWithProfile[];
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseForm({ groupId, members }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createExpense = useCreateExpense();

  // Quote personalizzate: userId -> importo (stringa, per l'input controllato).
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [shareError, setShareError] = useState<string | null>(null);

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      // L'input numerico parte vuoto; z.coerce gestisce la conversione.
      amount: '' as unknown as number,
      paidBy: user?.id ?? members[0]?.user_id ?? '',
      expenseDate: today(),
      splitMode: 'equal',
    },
  });

  const splitMode = form.watch('splitMode') as SplitMode;
  const amountValue = Number(form.watch('amount')) || 0;

  // Anteprima della divisione equa (distribuisce i centesimi di resto).
  const equalPreview = useMemo(() => {
    const parts = splitEqual(amountValue, members.length);
    return members.map((m, i) => ({ member: m, amount: parts[i] ?? 0 }));
  }, [amountValue, members]);

  const customTotal = useMemo(
    () =>
      members.reduce(
        (sum, m) => sum + (Number(customShares[m.user_id]) || 0),
        0,
      ),
    [customShares, members],
  );
  const customRemaining = round2(amountValue - customTotal);

  /** Costruisce le quote da inviare in base alla modalità di divisione. */
  const buildShares = (amount: number): ShareInput[] | null => {
    if (splitMode === 'equal') {
      const parts = splitEqual(amount, members.length);
      return members.map((m, i) => ({
        user_id: m.user_id,
        amount_due: parts[i] ?? 0,
      }));
    }

    const shares = members
      .map((m) => ({
        user_id: m.user_id,
        amount_due: round2(Number(customShares[m.user_id]) || 0),
      }))
      .filter((s) => s.amount_due > 0);

    if (shares.length === 0) {
      setShareError('Assegna almeno una quota maggiore di zero.');
      return null;
    }
    const total = shares.reduce((sum, s) => sum + s.amount_due, 0);
    if (Math.abs(round2(total) - amount) > 0.01) {
      setShareError(
        `La somma delle quote (${formatCurrency(total)}) deve essere pari a ${formatCurrency(amount)}.`,
      );
      return null;
    }
    return shares;
  };

  const onSubmit = async (values: ExpenseInput) => {
    setShareError(null);
    const shares = buildShares(values.amount);
    if (!shares) return;

    try {
      await createExpense.mutateAsync({
        groupId,
        description: values.description,
        amount: round2(values.amount),
        paidBy: values.paidBy,
        expenseDate: values.expenseDate,
        shares,
      });
      toast.success('Spesa aggiunta');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dettagli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Cena, spesa, benzina…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" max={today()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagato da</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona chi ha pagato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.profile.name}
                          {m.user_id === user?.id && ' (tu)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Divisione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="splitMode"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setShareError(null);
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="equal">Equa</TabsTrigger>
                    <TabsTrigger value="custom">Personalizzata</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />

            {splitMode === 'equal' ? (
              <ul className="divide-y rounded-lg border">
                {equalPreview.map(({ member, amount }) => (
                  <li
                    key={member.user_id}
                    className="flex items-center justify-between p-3"
                  >
                    <span className="flex items-center gap-2">
                      <UserAvatar
                        name={member.profile.name}
                        className="h-7 w-7 text-xs"
                      />
                      {member.profile.name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3"
                  >
                    <Label
                      htmlFor={`share-${member.user_id}`}
                      className="flex flex-1 items-center gap-2 font-normal"
                    >
                      <UserAvatar
                        name={member.profile.name}
                        className="h-7 w-7 text-xs"
                      />
                      {member.profile.name}
                    </Label>
                    <Input
                      id={`share-${member.user_id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-32"
                      value={customShares[member.user_id] ?? ''}
                      onChange={(e) =>
                        setCustomShares((prev) => ({
                          ...prev,
                          [member.user_id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm',
                    Math.abs(customRemaining) > 0.01 && 'text-destructive',
                  )}
                >
                  <span>Assegnato: {formatCurrency(customTotal)}</span>
                  <span>
                    {customRemaining === 0
                      ? 'Tutto assegnato ✓'
                      : `Mancano ${formatCurrency(customRemaining)}`}
                  </span>
                </div>
              </div>
            )}

            {shareError && (
              <p className="text-sm font-medium text-destructive">
                {shareError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/groups/${groupId}`)}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Salva spesa
          </Button>
        </div>
      </form>
    </Form>
  );
}

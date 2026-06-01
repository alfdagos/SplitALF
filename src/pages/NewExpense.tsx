import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useGroup } from '@/hooks/useGroups';
import { useMembers } from '@/hooks/useMembers';

export default function NewExpense() {
  const { groupId = '' } = useParams();
  const { data: group } = useGroup(groupId);
  const { data: members, isLoading } = useMembers(groupId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={`/groups/${groupId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {group?.name ?? 'Torna al gruppo'}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Nuova spesa
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : !members || members.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Aggiungi almeno un membro al gruppo prima di registrare una spesa.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/groups/${groupId}`}>Vai ai membri</Link>
          </Button>
        </div>
      ) : (
        <ExpenseForm groupId={groupId} members={members} />
      )}
    </div>
  );
}

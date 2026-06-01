import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { GroupSettingsMenu } from '@/components/groups/GroupSettingsMenu';
import { InviteMemberDialog } from '@/components/members/InviteMemberDialog';
import { MembersList } from '@/components/members/MembersList';
import { ExpenseHistory } from '@/components/expenses/ExpenseHistory';
import { GroupSummary } from '@/components/balances/GroupSummary';
import { useGroup } from '@/hooks/useGroups';

export default function GroupDetail() {
  const { groupId = '' } = useParams();
  const { data: group, isLoading, isError } = useGroup(groupId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Gruppo non trovato</h2>
        <p className="mt-1 text-muted-foreground">
          Il gruppo non esiste o non hai i permessi per visualizzarlo.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Torna alla dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutti i gruppi
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {group.name}
          </h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/groups/${group.id}/expenses/new`}>
                <Plus className="h-4 w-4" />
                Nuova spesa
              </Link>
            </Button>
            <GroupSettingsMenu group={group} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Spese</TabsTrigger>
          <TabsTrigger value="summary">Riepilogo</TabsTrigger>
          <TabsTrigger value="members">Membri</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <ExpenseHistory groupId={group.id} />
        </TabsContent>

        <TabsContent value="summary">
          <GroupSummary groupId={group.id} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <InviteMemberDialog groupId={group.id} />
          </div>
          <MembersList group={group} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { toast } from 'sonner';
import { Crown, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/UserAvatar';
import { BalanceAmount } from '@/components/BalanceAmount';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useMembers, useRemoveMember } from '@/hooks/useMembers';
import { useGroupBalances } from '@/hooks/useGroupBalances';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/errors';
import type { Group } from '@/types';

interface MembersListProps {
  group: Group;
}

export function MembersList({ group }: MembersListProps) {
  const { user } = useAuth();
  const { data: members, isLoading } = useMembers(group.id);
  const { balances } = useGroupBalances(group.id);
  const removeMember = useRemoveMember(group.id);

  const isCreator = user?.id === group.created_by;
  const balanceOf = (userId: string) =>
    balances.find((b) => b.userId === userId)?.net ?? 0;

  const handleRemove = async (userId: string, name: string) => {
    try {
      await removeMember.mutateAsync(userId);
      toast.success(
        userId === user?.id ? 'Hai lasciato il gruppo' : `${name} rimosso`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {(members ?? []).map((member) => {
        const isSelf = member.user_id === user?.id;
        const isGroupCreator = member.user_id === group.created_by;
        // Il creatore può rimuovere gli altri; ogni membro può lasciare il
        // gruppo. Il creatore non è rimovibile.
        const canRemove = !isGroupCreator && (isCreator || isSelf);

        return (
          <li
            key={member.user_id}
            className="flex items-center gap-3 p-4"
          >
            <UserAvatar name={member.profile.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">
                  {member.profile.name}
                  {isSelf && ' (tu)'}
                </p>
                {isGroupCreator && (
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Creatore
                  </Badge>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {member.profile.email}
              </p>
            </div>
            <div className="text-right">
              <BalanceAmount net={balanceOf(member.user_id)} showSign />
            </div>
            {canRemove && (
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={isSelf ? 'Lascia il gruppo' : 'Rimuovi membro'}
                  >
                    {isSelf ? (
                      <LogOut className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                }
                title={isSelf ? 'Lasciare il gruppo?' : 'Rimuovere il membro?'}
                description={
                  isSelf
                    ? 'Non vedrai più le spese di questo gruppo.'
                    : `${member.profile.name} verrà rimosso dal gruppo.`
                }
                confirmLabel={isSelf ? 'Lascia' : 'Rimuovi'}
                destructive
                onConfirm={() =>
                  handleRemove(member.user_id, member.profile.name)
                }
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

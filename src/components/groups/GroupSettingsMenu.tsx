import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useDeleteGroup, useRenameGroup } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { groupSchema, type GroupInput } from '@/lib/validations';
import { getErrorMessage } from '@/lib/errors';
import type { Group } from '@/types';

export function GroupSettingsMenu({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreator = user?.id === group.created_by;

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renameGroup = useRenameGroup(group.id);
  const deleteGroup = useDeleteGroup();

  const form = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group.name },
  });

  const onRename = async (values: GroupInput) => {
    try {
      await renameGroup.mutateAsync(values.name);
      toast.success('Nome del gruppo aggiornato');
      setRenameOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onDelete = async () => {
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success('Gruppo eliminato');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Impostazioni gruppo">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              form.reset({ name: group.name });
              setRenameOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rinomina
          </DropdownMenuItem>
          {isCreator && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina gruppo
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog di rinomina */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinomina gruppo</DialogTitle>
            <DialogDescription>
              Scegli un nuovo nome per il gruppo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onRename)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={renameGroup.isPending}>
                  {renameGroup.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Salva
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog di eliminazione */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminare il gruppo?</DialogTitle>
            <DialogDescription>
              Questa azione è irreversibile: verranno eliminate tutte le spese e
              le quote del gruppo «{group.name}».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteGroup.isPending}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

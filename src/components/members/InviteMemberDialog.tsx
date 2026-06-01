import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAddMember } from '@/hooks/useMembers';
import { inviteMemberSchema, type InviteMemberInput } from '@/lib/validations';
import { getErrorMessage } from '@/lib/errors';

export function InviteMemberDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const addMember = useAddMember(groupId);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: InviteMemberInput) => {
    try {
      const profile = await addMember.mutateAsync(values.email);
      toast.success(`${profile.name} è stato aggiunto al gruppo`);
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error('Impossibile aggiungere il membro', {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4" />
          Invita membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invita un membro</DialogTitle>
          <DialogDescription>
            Inserisci l’email di una persona già registrata su SplitALF.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="amico@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    L’utente deve aver già creato un account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Aggiungi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

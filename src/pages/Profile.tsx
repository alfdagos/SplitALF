import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { profileSchema, type ProfileInput } from '@/lib/validations';
import { getErrorMessage } from '@/lib/errors';

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  });

  // Popola il form una volta caricato il profilo.
  useEffect(() => {
    if (profile) form.reset({ name: profile.name });
  }, [profile, form]);

  const onSubmit = async (values: ProfileInput) => {
    try {
      await updateProfile.mutateAsync(values.name);
      toast.success('Profilo aggiornato');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Profilo" description="Gestisci i tuoi dati personali." />

      {isLoading || !profile ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserAvatar name={profile.name} className="h-14 w-14 text-lg" />
              <div>
                <CardTitle>{profile.name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled readOnly />
                  <p className="text-xs text-muted-foreground">
                    L’email non può essere modificata.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfile.isPending || !form.formState.isDirty}
                >
                  {updateProfile.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Salva modifiche
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

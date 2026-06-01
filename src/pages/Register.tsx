import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { getErrorMessage } from '@/lib/errors';

export default function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterInput) => {
    setSubmitting(true);
    try {
      const { session } = await authService.signUp(values);
      if (session) {
        // Email confirmation disabilitata: l'utente è già loggato.
        toast.success('Benvenuto in SplitALF!');
        navigate('/', { replace: true });
      } else {
        // Email confirmation attiva: serve conferma via email.
        toast.success('Registrazione completata', {
          description: 'Controlla la tua email per confermare l’account.',
        });
        navigate('/login', { replace: true });
      }
    } catch (error) {
      toast.error('Registrazione non riuscita', {
        description: getErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
        <CardDescription>
          Bastano pochi secondi per iniziare a dividere le spese.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Mario Rossi"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="mario.rossi@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Almeno 6 caratteri.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrati
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Hai già un account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Accedi
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

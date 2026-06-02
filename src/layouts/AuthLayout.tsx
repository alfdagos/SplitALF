import { Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

/** Layout centrato per le pagine di autenticazione. */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="animate-rise mb-8 flex items-center gap-3">
        <div className="bg-ember glow-ember flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">
          Split<span className="text-ember">ALF</span>
        </span>
      </div>

      <div className="animate-rise w-full max-w-md [animation-delay:90ms]">
        <Outlet />
      </div>

      <p className="animate-rise mt-8 text-center text-sm text-muted-foreground [animation-delay:180ms]">
        Spese condivise, conti chiari.
      </p>
    </div>
  );
}

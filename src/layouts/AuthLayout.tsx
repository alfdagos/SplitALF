import { Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';

/** Layout centrato per le pagine di autenticazione. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-ember glow-ember flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">
          Split<span className="text-ember">ALF</span>
        </span>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Spese condivise, conti chiari.
      </p>
    </div>
  );
}

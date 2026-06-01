import { Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';

/** Layout centrato per le pagine di autenticazione. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight">SplitALF</span>
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

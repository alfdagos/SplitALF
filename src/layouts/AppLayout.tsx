import { Link, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/UserAvatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useProfile } from '@/hooks/useProfile';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/errors';

/** Layout principale dell'app autenticata: header con navigazione + contenuto. */
export function AppLayout() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const displayName = profile?.name ?? 'Utente';

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Logout effettuato');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-ember glow-ember flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Split<span className="text-ember">ALF</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
                aria-label="Menu utente"
              >
                <UserAvatar name={displayName} />
                <span className="hidden text-sm font-medium sm:inline">
                  {displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {profile?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profilo
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          SplitALF · spese condivise per piccoli gruppi
        </div>
      </footer>
    </div>
  );
}

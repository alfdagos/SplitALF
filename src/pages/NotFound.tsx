import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Pagina non trovata</h1>
      <p className="mt-1 text-muted-foreground">
        La pagina che cerchi non esiste o è stata spostata.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Torna alla dashboard</Link>
      </Button>
    </div>
  );
}

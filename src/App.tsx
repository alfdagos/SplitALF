import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes/AppRoutes';

// HashRouter: garantisce il funzionamento su GitHub Pages senza configurazione
// lato server (nessun 404 sui refresh di rotte profonde).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

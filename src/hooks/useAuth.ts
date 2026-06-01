import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';

/** Accede alla sessione/utente correnti. Deve stare dentro <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  }
  return ctx;
}

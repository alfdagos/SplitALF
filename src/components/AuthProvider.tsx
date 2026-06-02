import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/lib/auth-context';

/**
 * Mantiene la sessione Supabase in sincronia con lo stato React e si
 * sottoscrive ai cambi di autenticazione (login, logout, refresh token).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // I link email (conferma registrazione / recupero password) tornano con i
    // token nell'hash dell'URL. Con HashRouter quell'hash non è una rotta
    // valida: dopo che supabase-js ha elaborato la sessione, lo ripuliamo e
    // instradiamo verso una rotta esistente.
    const initialHash = window.location.hash;
    const isRecovery = initialHash.includes('type=recovery');
    const isAuthRedirect =
      isRecovery ||
      initialHash.includes('access_token=') ||
      initialHash.includes('error=');

    // getSession() attende il completamento di detectSessionInUrl: a quel punto
    // i token sono già stati letti e si può ripulire l'hash senza perderli.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (isRecovery) {
        window.location.hash = '#/reset-password';
      } else if (isAuthRedirect) {
        window.location.hash = '#/';
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '#/reset-password';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

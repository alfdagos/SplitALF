/**
 * Servizio di autenticazione: incapsula tutte le chiamate a Supabase Auth.
 * I componenti non chiamano mai `supabase.auth` direttamente.
 */
import { supabase } from '@/lib/supabase';

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

/**
 * URL base dell'app (origin + path), SENZA hash. È il bersaglio dei redirect
 * dei link email: deve essere assoluto e presente nella allow-list di Supabase.
 * In locale vale http://localhost:5173/, in produzione
 * https://alfdagos.github.io/SplitALF/ — così funziona in entrambi gli ambienti.
 */
function appBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export const authService = {
  async signUp({ name, email, password }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Letto dal trigger handle_new_user per popolare il nome del profilo.
        data: { name },
        // Dove tornare dopo aver cliccato il link di conferma nell'email.
        emailRedirectTo: appBaseUrl(),
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Invia l'email di recupero password. Il redirect punta all'URL base
   * (senza hash): al ritorno l'evento PASSWORD_RECOVERY instrada l'utente
   * alla pagina di reset (vedi AuthProvider).
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appBaseUrl(),
    });
    if (error) throw error;
  },

  /** Aggiorna la password dell'utente autenticato (post recupero). */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};

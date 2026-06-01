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

export const authService = {
  async signUp({ name, email, password }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Letto dal trigger handle_new_user per popolare il nome del profilo.
        data: { name },
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

  /** Invia l'email di recupero password con redirect alla pagina di reset. */
  async resetPassword(email: string) {
    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
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

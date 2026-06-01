import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variabili d\'ambiente Supabase mancanti. Copia ".env.example" in ".env" ' +
      'e imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  );
}

/** Client Supabase tipizzato, condiviso da tutta l'applicazione. */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

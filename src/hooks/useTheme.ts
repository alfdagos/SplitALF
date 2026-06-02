import { useContext } from 'react';
import { ThemeContext } from '@/lib/theme-context';

/** Accede al tema corrente e ai suoi controlli. Richiede <ThemeProvider>. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme deve essere usato dentro <ThemeProvider>');
  }
  return ctx;
}

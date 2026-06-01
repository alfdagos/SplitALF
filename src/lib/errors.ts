/** Estrae un messaggio leggibile da un errore Supabase o generico. */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  if (typeof error === 'string') return error;
  return 'Si è verificato un errore imprevisto.';
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

/** Combina classi condizionali e risolve i conflitti Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatta un numero come importo in Euro (it-IT). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/** Formatta una data ISO (yyyy-MM-dd o timestamp) in formato leggibile. */
export function formatDate(value: string, pattern = 'd MMM yyyy'): string {
  return format(parseISO(value), pattern, { locale: it });
}

/** Arrotonda a 2 decimali evitando errori di virgola mobile. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Iniziali per gli avatar (es. "Mario Rossi" -> "MR"). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

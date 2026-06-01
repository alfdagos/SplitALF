/**
 * Schemi di validazione Zod condivisi tra i form (React Hook Form) e i servizi.
 */
import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email obbligatoria')
  .email('Email non valida');

export const passwordSchema = z
  .string()
  .min(6, 'La password deve avere almeno 6 caratteri');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password obbligatoria'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri').max(60),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Le password non coincidono',
    path: ['confirm'],
  });

export const profileSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri').max(60),
});

export const groupSchema = z.object({
  name: z
    .string()
    .min(1, 'Il nome del gruppo è obbligatorio')
    .max(80, 'Massimo 80 caratteri'),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
});

export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, 'La descrizione è obbligatoria')
    .max(140, 'Massimo 140 caratteri'),
  amount: z.coerce
    .number({ invalid_type_error: 'Inserisci un importo valido' })
    .positive("L'importo deve essere maggiore di zero")
    .max(1_000_000, 'Importo troppo elevato'),
  paidBy: z.string().uuid('Seleziona chi ha pagato'),
  expenseDate: z.string().min(1, 'La data è obbligatoria'),
  splitMode: z.enum(['equal', 'custom']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

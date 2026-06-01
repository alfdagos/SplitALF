/**
 * Tipi del database Supabase.
 *
 * Riproducono lo schema definito nelle migration SQL, nel formato prodotto da
 * `supabase gen types typescript` (con `Relationships`, `Views`, `Functions`,
 * `Enums` e `CompositeTypes`), così da soddisfare i vincoli del client tipizzato.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          description: string;
          amount: number;
          paid_by: string;
          expense_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          description: string;
          amount: number;
          paid_by: string;
          expense_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          description?: string;
          amount?: number;
          paid_by?: string;
          expense_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      expense_shares: {
        Row: {
          expense_id: string;
          user_id: string;
          amount_due: number;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          amount_due: number;
        };
        Update: {
          expense_id?: string;
          user_id?: string;
          amount_due?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_member_by_email: {
        Args: { _group_id: string; _email: string };
        Returns: Database['public']['Tables']['profiles']['Row'];
      };
      create_expense_with_shares: {
        Args: {
          _group_id: string;
          _description: string;
          _amount: number;
          _paid_by: string;
          _expense_date: string;
          _shares: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

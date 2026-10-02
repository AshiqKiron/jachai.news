/**
 * Supabase Database types — keep in sync with supabase/migrations/.
 * Regenerate later with: npx supabase gen types typescript --local
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SubscriptionPlan = "monthly" | "yearly";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          locale: "en" | "bn";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          locale?: "en" | "bn";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          locale?: "en" | "bn";
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      bkash_agreements: {
        Row: {
          id: string;
          user_id: string;
          agreement_id: string;
          payer_reference: string | null;
          status: "pending" | "completed" | "cancelled" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agreement_id: string;
          payer_reference?: string | null;
          status?: "pending" | "completed" | "cancelled" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          payer_reference?: string | null;
          status?: "pending" | "completed" | "cancelled" | "failed";
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          provider: string;
          provider_trx_id: string | null;
          amount_bdt: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          provider?: string;
          provider_trx_id?: string | null;
          amount_bdt: number;
          currency?: string;
          status: "pending" | "completed" | "failed" | "refunded";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          subscription_id?: string | null;
          provider_trx_id?: string | null;
          status?: "pending" | "completed" | "failed" | "refunded";
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
    };
  };
}

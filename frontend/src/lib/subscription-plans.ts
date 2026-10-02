/** Jachai Pro — planned billing (not wired yet). Feature matrix: `subscription-features.ts`. */

export type SubscriptionInterval = "monthly" | "yearly";

export type SubscriptionPlan = {
  id: SubscriptionInterval;
  label: string;
  labelBn: string;
  amountBdt: number;
  interval: SubscriptionInterval;
  /** Short note for UI, e.g. savings on yearly */
  badge?: string;
};

export const SUBSCRIPTION_PAYMENT_PROVIDER = "bKash Tokenized Checkout API" as const;

/** Subscription state and payment records live in Supabase (not backend Postgres). */
export const SUBSCRIPTION_DATABASE = "supabase" as const;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    label: "Monthly",
    labelBn: "মাসিক",
    amountBdt: 49,
    interval: "monthly",
  },
  {
    id: "yearly",
    label: "Yearly",
    labelBn: "বার্ষিক",
    amountBdt: 399,
    interval: "yearly",
    badge: "Save vs 12× monthly",
  },
];

export function formatPlanPrice(amountBdt: number): string {
  return `৳${amountBdt.toLocaleString("en-BD")}`;
}

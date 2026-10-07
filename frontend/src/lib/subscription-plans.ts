/** Shorup Pro — planned billing (not wired yet). Feature matrix: `subscription-features.ts`. */

export type SubscriptionInterval = "monthly" | "yearly";

export type SubscriptionPlan = {
  id: SubscriptionInterval;
  label: string;
  labelBn: string;
  amountBdt: number;
  interval: SubscriptionInterval;
};

/** Checkout gateway (REST + HMAC webhooks; supports bKash/Nagad/bank in BD). */
export const SUBSCRIPTION_PAYMENT_PROVIDER = "PayEurasia" as const;

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
  },
];

export function formatPlanPrice(amountBdt: number): string {
  return `৳${amountBdt.toLocaleString("en-BD")}`;
}

export type YearlyPlanSavings = {
  /** BDT saved vs paying monthly for 12 months */
  amountBdt: number;
  /** 0–100, rounded */
  percentOff: number;
  /** Monthly price × 12 */
  yearlyIfMonthlyBdt: number;
  /** Yearly price ÷ 12, rounded for display */
  effectiveMonthlyBdt: number;
};

/** null when plans are missing or yearly is not cheaper than 12× monthly */
export function getYearlyPlanSavings(): YearlyPlanSavings | null {
  const monthly = SUBSCRIPTION_PLANS.find((p) => p.id === "monthly");
  const yearly = SUBSCRIPTION_PLANS.find((p) => p.id === "yearly");
  if (!monthly || !yearly) return null;

  const yearlyIfMonthlyBdt = monthly.amountBdt * 12;
  const amountBdt = yearlyIfMonthlyBdt - yearly.amountBdt;
  if (amountBdt <= 0) return null;

  const percentOff = Math.round((amountBdt / yearlyIfMonthlyBdt) * 100);
  const effectiveMonthlyBdt = Math.round(yearly.amountBdt / 12);

  return { amountBdt, percentOff, yearlyIfMonthlyBdt, effectiveMonthlyBdt };
}

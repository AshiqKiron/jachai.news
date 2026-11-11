/** khatinews Pro — planned billing (not wired yet). Feature matrix: `subscription-features.ts`. */

export type SubscriptionInterval = "day" | "monthly" | "yearly";

export type SubscriptionPlan = {
  id: SubscriptionInterval;
  label: string;
  labelBn: string;
  amountBdt: number;
  interval: SubscriptionInterval;
  /** Extra line under the plan name. Day pass is a one-time 24-hour window. */
  note?: string;
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
  {
    id: "day",
    label: "Day pass",
    labelBn: "এক দিনের পাস",
    amountBdt: 15,
    interval: "day",
    note: "One-time Pro access for 24 hours.",
  },
];

export function formatPlanPrice(amountBdt: number): string {
  return `৳${amountBdt.toLocaleString("en-BD")}`;
}

/** Compact cadence next to a price: `/24h`, `/mo`, `/yr`. */
export function formatPlanPriceSuffix(interval: SubscriptionInterval): string {
  switch (interval) {
    case "day":
      return "/24h";
    case "yearly":
      return "/yr";
    case "monthly":
      return "/mo";
  }
}

/** Paid window starting at `start`. A day pass lasts 24 hours. */
export function subscriptionPeriodEnd(start: Date, interval: SubscriptionInterval): Date {
  const end = new Date(start.getTime());
  if (interval === "day") {
    end.setTime(end.getTime() + 24 * 60 * 60 * 1000);
    return end;
  }
  if (interval === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
    return end;
  }
  end.setMonth(end.getMonth() + 1);
  return end;
}

/** Day pass ends when the 24-hour window ends. Monthly and yearly renew. */
export function planRenews(interval: SubscriptionInterval): boolean {
  return interval !== "day";
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

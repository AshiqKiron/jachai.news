import type { SubscriptionEntitlementRow, SubscriptionStatus } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing"]);

export type ProAccessSource = "mock" | "subscription" | "none";

export type ProAccessState = {
  isPro: boolean;
  source: ProAccessSource;
  userId: string | null;
};

/** Pure check — active/trialing and current period not expired. */
export function isActiveProSubscription(
  subscription: SubscriptionEntitlementRow | null | undefined,
): boolean {
  if (!subscription) return false;
  if (!ACTIVE_STATUSES.has(subscription.status)) return false;

  const periodEnd = new Date(subscription.current_period_end);
  if (Number.isNaN(periodEnd.getTime())) return false;
  return periodEnd.getTime() > Date.now();
}

/**
 * Pro entitlement via Supabase RLS (`subscriptions` SELECT own row) using the
 * HTTP-only session refreshed in middleware. Falls back to NEXT_PUBLIC_MOCK_PRO locally.
 */
export async function getProAccessState(): Promise<ProAccessState> {
  if (process.env.NEXT_PUBLIC_MOCK_PRO === "true") {
    return { isPro: true, source: "mock", userId: null };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { isPro: false, source: "none", userId: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isPro: false, source: "none", userId: null };
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    return { isPro: false, source: "none", userId: user.id };
  }

  const isPro = isActiveProSubscription(subscription);
  return {
    isPro,
    source: isPro ? "subscription" : "none",
    userId: user.id,
  };
}

export async function hasProAccess(): Promise<boolean> {
  const state = await getProAccessState();
  return state.isPro;
}

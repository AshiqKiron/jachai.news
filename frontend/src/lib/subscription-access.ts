import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isActiveProSubscription } from "@/lib/subscription-entitlement";

export type ProAccessSource = "mock" | "subscription" | "none";

export type ProAccessState = {
  isPro: boolean;
  source: ProAccessSource;
  userId: string | null;
};

export { isActiveProSubscription } from "@/lib/subscription-entitlement";

/**
 * Pro entitlement via Supabase RLS (`subscriptions` SELECT own row) using the
 * HTTP-only session refreshed in middleware. Falls back to NEXT_PUBLIC_MOCK_PRO locally.
 */
export const getProAccessState = cache(async (): Promise<ProAccessState> => {
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
});

export async function hasProAccess(): Promise<boolean> {
  const state = await getProAccessState();
  return state.isPro;
}

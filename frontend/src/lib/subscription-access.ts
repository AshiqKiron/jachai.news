import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isActiveProSubscription } from "@/lib/subscription-entitlement";

export type ProAccessSource = "mock" | "subscription" | "none";

export type ProAccessState = {
  isPro: boolean;
  source: ProAccessSource;
  userId: string | null;
  /** Set when a signed-in user was resolved (for profile / header copy). */
  displayName: string | null;
};

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string | null {
  const fromMeta =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";
  if (fromMeta) return fromMeta;
  const local = user.email?.split("@")[0]?.trim();
  return local || null;
}

export { isActiveProSubscription } from "@/lib/subscription-entitlement";

/**
 * Pro entitlement via Supabase RLS (`subscriptions` SELECT own row) using the
 * HTTP-only session refreshed in middleware. Falls back to NEXT_PUBLIC_MOCK_PRO locally.
 */
export const getProAccessState = cache(async (): Promise<ProAccessState> => {
  if (process.env.NEXT_PUBLIC_MOCK_PRO === "true") {
    return { isPro: true, source: "mock", userId: null, displayName: null };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { isPro: false, source: "none", userId: null, displayName: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isPro: false, source: "none", userId: null, displayName: null };
  }

  const displayName = displayNameFromUser(user);

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    return { isPro: false, source: "none", userId: user.id, displayName };
  }

  const isPro = isActiveProSubscription(subscription);
  return {
    isPro,
    source: isPro ? "subscription" : "none",
    userId: user.id,
    displayName,
  };
});

export async function hasProAccess(): Promise<boolean> {
  const state = await getProAccessState();
  return state.isPro;
}

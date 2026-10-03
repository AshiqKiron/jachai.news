"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isActiveProSubscription } from "@/lib/subscription-entitlement";

const mockPro = process.env.NEXT_PUBLIC_MOCK_PRO === "true";

/**
 * Pro/browse CTA — resolved on the client so the home page shell can stream without
 * blocking on Supabase subscription reads during SSR.
 */
export function HomeArchiveLink() {
  const [pro, setPro] = useState(mockPro);

  useEffect(() => {
    if (mockPro) return;

    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setPro(isActiveProSubscription(subscription));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (pro) {
    return (
      <Link href="/browse" className="text-xs text-zinc-500 hover:text-zinc-300">
        Browse all →
      </Link>
    );
  }

  return null;
}

export function HomeStoriesSectionTitle() {
  return (
    <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
      Top news
    </h2>
  );
}

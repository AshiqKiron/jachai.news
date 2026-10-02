"use client";

import Link from "next/link";
import { useState } from "react";

import { PaywallModal } from "@/components/PaywallModal";
import { FREE_DAILY_TOP_STORIES_LIMIT, getFeatureRow } from "@/lib/subscription-features";

export function BrowseProGate() {
  const [open, setOpen] = useState(false);
  const feature = getFeatureRow("browse_full_search");

  return (
    <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Pro feature</p>
      <h2 className="mt-2 font-display text-xl text-zinc-50">
        {feature?.name ?? "Browse all news"}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-zinc-400">
        Free accounts see the{" "}
        <Link href="/" className="text-zinc-200 underline decoration-zinc-600 underline-offset-2">
          daily top {FREE_DAILY_TOP_STORIES_LIMIT}
        </Link>{" "}
        on the home feed. Jachai Pro unlocks the full historical archive and search.
      </p>
      <p className="mt-1 font-bengali text-sm text-zinc-500">
        ফ্রি: আজকের শীর্ষ {FREE_DAILY_TOP_STORIES_LIMIT} · Pro: পুরো ডাটাবেস
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Upgrade to Pro
        </button>
        <Link
          href="/pro"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Compare plans
        </Link>
      </div>
      <PaywallModal
        open={open}
        onClose={() => setOpen(false)}
        featureId="browse_full_search"
      />
    </section>
  );
}

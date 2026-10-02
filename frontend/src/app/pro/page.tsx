"use client";

import { useState } from "react";

import { FeatureMatrixTable } from "@/components/FeatureMatrixTable";
import { PaywallModal } from "@/components/PaywallModal";
import {
  FREE_TIER_TAGLINE,
  PRO_TIER_TAGLINE,
} from "@/lib/subscription-features";
import {
  SUBSCRIPTION_DATABASE,
  SUBSCRIPTION_PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
} from "@/lib/subscription-plans";

export default function ProPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 pb-4">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-3xl text-zinc-50">Jachai Pro</h1>
        <p className="text-zinc-400">{PRO_TIER_TAGLINE}</p>
        <p className="font-bengali text-sm text-zinc-500">
          ৳৪৯/মাস — গভীর আর্কাইভ, অগ্রাধিকার লোডিং, ও Pro বিশ্লেষণ।
        </p>
      </header>

      <div className="grid max-w-lg gap-3 sm:grid-cols-2">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <p className="text-sm text-zinc-400">
              {plan.label}{" "}
              <span className="font-bengali">({plan.labelBn})</span>
            </p>
            <p className="mt-1 font-display text-2xl text-zinc-50">
              {formatPlanPrice(plan.amountBdt)}
              <span className="text-base font-sans text-zinc-500">
                /{plan.interval === "monthly" ? "month" : "year"}
              </span>
            </p>
            {plan.badge ? <p className="mt-2 text-xs text-accent">{plan.badge}</p> : null}
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Free vs Pro
        </h2>
        <p className="max-w-2xl text-sm text-zinc-500">{FREE_TIER_TAGLINE}</p>
        <FeatureMatrixTable />
      </section>

      <p className="max-w-xl text-sm text-zinc-500">
        Billing via {SUBSCRIPTION_PAYMENT_PROVIDER}. Subscription records in{" "}
        {SUBSCRIPTION_DATABASE.charAt(0).toUpperCase() + SUBSCRIPTION_DATABASE.slice(1)} — integration
        pending.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        Subscribe with bKash
      </button>
      <PaywallModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

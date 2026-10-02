"use client";

import { useState } from "react";

import { PaywallModal } from "@/components/PaywallModal";
import {
  SUBSCRIPTION_DATABASE,
  SUBSCRIPTION_PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
} from "@/lib/subscription-plans";

export default function ProPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-zinc-50">Jachai Pro</h1>
      <p className="max-w-xl text-zinc-400">
        Pro adds exportable briefing packs, custom rumor alerts, and historical bias drift for your saved outlets.
      </p>

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

      <p className="max-w-xl text-sm text-zinc-500">
        Billing via {SUBSCRIPTION_PAYMENT_PROVIDER}. Subscription records in{" "}
        {SUBSCRIPTION_DATABASE.charAt(0).toUpperCase() + SUBSCRIPTION_DATABASE.slice(1)} — integration
        pending.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        View plans
      </button>
      <PaywallModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

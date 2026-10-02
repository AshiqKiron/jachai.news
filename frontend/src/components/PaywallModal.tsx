"use client";

import {
  SUBSCRIPTION_PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
} from "@/lib/subscription-plans";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PaywallModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-ink-900 p-6 shadow-2xl">
        <h2 className="font-display text-xl text-zinc-50">Jachai Pro</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Unlock deeper bias timelines, exportable clash briefs, and rumor watchlists.
        </p>

        <ul className="mt-5 space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <li
              key={plan.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {plan.label}
                  <span className="ml-2 font-bengali text-zinc-400">({plan.labelBn})</span>
                </p>
                {plan.badge ? (
                  <p className="mt-0.5 text-xs text-accent">{plan.badge}</p>
                ) : null}
              </div>
              <p className="font-display text-lg text-zinc-50">
                {formatPlanPrice(plan.amountBdt)}
                <span className="text-sm font-sans text-zinc-500">
                  /{plan.interval === "monthly" ? "mo" : "yr"}
                </span>
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-zinc-500">
          Payment: {SUBSCRIPTION_PAYMENT_PROVIDER} (checkout not enabled yet).
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled
            title="bKash checkout coming soon"
            className="flex-1 cursor-not-allowed rounded-lg bg-accent/50 px-4 py-2 text-sm font-medium text-white"
          >
            Subscribe with bKash
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

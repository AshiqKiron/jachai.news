"use client";

import Link from "next/link";

import {
  PRO_TIER_TAGLINE,
  getFeatureRow,
  type ProOnlyFeatureId,
} from "@/lib/subscription-features";
import {
  SUBSCRIPTION_PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  getYearlyPlanSavings,
} from "@/lib/subscription-plans";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, surfaces the matching matrix row in the modal. */
  featureId?: ProOnlyFeatureId;
};

export function PaywallModal({ open, onClose, featureId }: Props) {
  if (!open) return null;

  const feature = featureId ? getFeatureRow(featureId) : undefined;
  const yearlySavings = getYearlyPlanSavings();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-ink-900 p-5 shadow-2xl sm:p-6">
        <h2 className="font-display text-xl text-zinc-50">Shorup Pro</h2>
        <p className="mt-2 text-sm text-zinc-400">{PRO_TIER_TAGLINE}</p>
        {feature ? (
          <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">
            <span className="text-zinc-500">Unlock: </span>
            {feature.name}
            {feature.proNote ? (
              <span className="mt-1 block text-xs text-zinc-500">{feature.proNote}</span>
            ) : null}
          </p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100">
                  {plan.label}
                  <span className="ml-2 font-bengali text-zinc-400">({plan.labelBn})</span>
                </p>
                {plan.id === "yearly" && yearlySavings ? (
                  <p className="mt-1.5 inline-flex w-fit rounded-md border border-emerald-700/20 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100">
                    Save {formatPlanPrice(yearlySavings.amountBdt)}/yr ({yearlySavings.percentOff}% vs
                    monthly)
                  </p>
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled
            title="PayEurasia checkout coming soon"
            className="flex-1 cursor-not-allowed rounded-lg bg-accent/50 px-4 py-2 text-sm font-medium text-white"
          >
            Subscribe with {SUBSCRIPTION_PAYMENT_PROVIDER}
          </button>
          <Link
            href="/pro"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Full matrix
          </Link>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";

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
  const pathname = usePathname();
  const onPlansPage = pathname === "/pro";

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const feature = featureId ? getFeatureRow(featureId) : undefined;
  const yearlySavings = getYearlyPlanSavings();
  const monthlyPlan = SUBSCRIPTION_PLANS.find((p) => p.id === "monthly");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-ink-900 p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="paywall-title" className="font-display text-xl text-zinc-50">
              Upgrade to Shorup Pro
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">{PRO_TIER_TAGLINE}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {feature ? (
          <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              You&apos;re unlocking
            </p>
            <p className="mt-1 text-base font-medium text-zinc-100">{feature.name}</p>
            {feature.proNote ? (
              <p className="mt-1 text-sm text-zinc-500">{feature.proNote}</p>
            ) : null}
          </div>
        ) : null}

        <ul className="mt-5 space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isYearly = plan.id === "yearly";
            return (
              <li
                key={plan.id}
                className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  isYearly
                    ? "border-accent/35 bg-accent/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-100">
                    <span>
                      {plan.label}
                      <span className="ml-2 font-bengali font-normal text-zinc-400">
                        ({plan.labelBn})
                      </span>
                    </span>
                    {isYearly ? (
                      <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        Best value
                      </span>
                    ) : null}
                  </p>
                  {isYearly && yearlySavings ? (
                    <p className="mt-1.5 inline-flex w-fit rounded-md border border-emerald-700/20 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100">
                      Save {formatPlanPrice(yearlySavings.amountBdt)}/yr ({yearlySavings.percentOff}%
                      vs monthly)
                      {yearlySavings.effectiveMonthlyBdt > 0 ? (
                        <span className="font-normal text-emerald-800/90 dark:text-emerald-100/90">
                          {" "}
                          · ~{formatPlanPrice(yearlySavings.effectiveMonthlyBdt)}/mo
                        </span>
                      ) : null}
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
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled
            title={`${SUBSCRIPTION_PAYMENT_PROVIDER} checkout coming soon`}
            className="w-full cursor-not-allowed rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white opacity-60 dark:text-black"
          >
            {monthlyPlan
              ? `Get Pro — ${formatPlanPrice(monthlyPlan.amountBdt)}/mo`
              : "Get Shorup Pro"}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            Secure checkout with {SUBSCRIPTION_PAYMENT_PROVIDER} opens soon. Cancel anytime — news
            stays free for everyone.
          </p>

          {!onPlansPage ? (
            <Link
              href="/pro"
              onClick={onClose}
              className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-center text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Compare plans &amp; all Pro features
            </Link>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-1 py-2 text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-300 hover:underline"
          >
            Continue with Free
          </button>
        </div>
      </div>
    </div>
  );
}

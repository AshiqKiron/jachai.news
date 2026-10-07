"use client";

import {
  FREE_TIER_TAGLINE,
  PRO_TIER_TAGLINE,
  SUBSCRIPTION_FEATURE_MATRIX,
} from "@/lib/subscription-features";
import {
  SUBSCRIPTION_PAYMENT_PROVIDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  getYearlyPlanSavings,
} from "@/lib/subscription-plans";

function PlanFeatureStatusIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/90"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25a1 1 0 1 1 1.414-1.414l2.543 2.543 6.543-6.543a1 1 0 0 1 1.412-.006Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlanFeatureList({ plan }: { plan: "free" | "pro" }) {
  return (
    <ul className="space-y-3">
      {SUBSCRIPTION_FEATURE_MATRIX.map((row) => {
        const tier = plan === "free" ? row.free : row.pro;
        const included = tier === "yes";

        return (
          <li key={row.id} className="flex items-start gap-2.5">
            <PlanFeatureStatusIcon included={included} />
            <p className={`text-sm font-medium ${included ? "text-zinc-100" : "text-zinc-500"}`}>
              {row.name}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  onBuyPro: () => void;
};

export function SubscriptionPlanCards({ onBuyPro }: Props) {
  const monthly = SUBSCRIPTION_PLANS.find((p) => p.id === "monthly");
  const yearly = SUBSCRIPTION_PLANS.find((p) => p.id === "yearly");
  const yearlySavings = getYearlyPlanSavings();

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-5 sm:gap-6 lg:max-w-5xl lg:grid-cols-2">
      <article className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
        <header className="border-b border-zinc-800 px-5 py-4">
          <h2 className="font-display text-xl text-zinc-50">Free</h2>
          <p className="mt-2 text-sm text-zinc-400">{FREE_TIER_TAGLINE}</p>
        </header>
        <div className="flex flex-1 flex-col px-5 py-4">
          <PlanFeatureList plan="free" />
        </div>
      </article>

      <article className="flex flex-col rounded-xl border border-accent/40 bg-zinc-900/50 shadow-lg shadow-accent/5">
        <header className="border-b border-accent/20 bg-accent/5 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-display text-xl text-zinc-50">Shorup Pro</h2>
            {monthly ? (
              <p className="font-display text-xl text-zinc-50">
                {formatPlanPrice(monthly.amountBdt)}
                <span className="text-sm font-sans text-zinc-500">/month</span>
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{PRO_TIER_TAGLINE}</p>
          {yearly ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                or {formatPlanPrice(yearly.amountBdt)}/year
              </p>
              {yearlySavings ? (
                <span
                  className="inline-flex w-fit max-w-full items-center rounded-md border border-emerald-700/20 bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100"
                  aria-label={`Save ${formatPlanPrice(yearlySavings.amountBdt)}, ${yearlySavings.percentOff} percent off annual billing`}
                >
                  Save {formatPlanPrice(yearlySavings.amountBdt)} ({yearlySavings.percentOff}% off)
                </span>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="flex flex-1 flex-col px-5 py-4">
          <PlanFeatureList plan="pro" />
          <div className="mt-6 border-t border-zinc-800 pt-5">
            <button
              type="button"
              onClick={onBuyPro}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Buy Pro with {SUBSCRIPTION_PAYMENT_PROVIDER}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

"use client";

import { useState } from "react";

import { FeatureMatrixTable } from "@/components/FeatureMatrixTable";
import { PaywallModal } from "@/components/PaywallModal";
import { SubscriptionPlanCards } from "@/components/SubscriptionPlanCards";

export default function ProPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 pb-4">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="page-title">Plans</h1>
        <p className="text-zinc-400">
          Compare Free and khatinews Pro — same trust tools, deeper archive and analytics on Pro.
          A day pass unlocks Pro for 24 hours.
        </p>
      </header>

      <SubscriptionPlanCards onBuyPro={() => setOpen(true)} />

      <section className="mx-auto w-full max-w-4xl space-y-3 lg:max-w-5xl">
        <h2 className="text-sm font-medium text-zinc-400">Free vs Pro</h2>
        <FeatureMatrixTable />
      </section>

      <PaywallModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

"use client";

import { useState } from "react";

import { PaywallModal } from "@/components/PaywallModal";
import { SubscriptionPlanCards } from "@/components/SubscriptionPlanCards";

export default function ProPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 pb-4">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="page-title">Plans</h1>
        <p className="text-zinc-400">
          Compare Free and Shorup Pro — same trust tools, deeper archive and analytics on Pro.
        </p>
      </header>

      <SubscriptionPlanCards onBuyPro={() => setOpen(true)} />

      <PaywallModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

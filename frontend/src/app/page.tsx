import Link from "next/link";

import { HomeArchiveLink, HomeStoriesSectionTitle } from "@/components/HomeArchiveLink";
import { HomeStoryGridClient } from "@/components/HomeStoryGridClient";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <div className="space-y-10 pb-4">
      <section className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-muted">বাংলাদেশ · Headlines compared</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-zinc-50 md:text-5xl">
          একই খবর, বিভিন্ন কণ্ঠ।
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Jachai clusters the same story from popular Bangladeshi news outlets — compare framing, spot blindspots, and
          read with context. Like Ground News, built for Bangladesh.
        </p>
      </section>

      <section className="flex gap-3 overflow-x-auto pb-1">
        <QuickLink href="/blindspot" label="Blindspot" sub="এক ঝুঁকে বেশি" />
        <QuickLink href="/bias" label="Source map" sub="ঝুঁক ও তথ্যবিশ্বাস" />
        <QuickLink href="/rumors" label="Rumors" sub="অপ্রমাণিত" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <HomeStoriesSectionTitle />
          <HomeArchiveLink />
        </div>
        <HomeStoryGridClient />
      </section>
    </div>
  );
}

function QuickLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="min-w-[140px] rounded-xl border border-zinc-800 bg-ink-900/60 px-4 py-3 hover:border-zinc-600"
    >
      <p className="text-sm font-medium text-zinc-100">{label}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </Link>
  );
}

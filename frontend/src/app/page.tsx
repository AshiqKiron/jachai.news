import { Suspense } from "react";

import { HeaderBanglaDate } from "@/components/HeaderBanglaDate";
import { HomeStoryGridClient } from "@/components/HomeStoryGridClient";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <div className="space-y-10 pb-4">
      <section className="max-w-2xl">
        <h1 className="page-hero-title font-bengali">
          একই খবর, বিভিন্ন কণ্ঠ।
        </h1>
        <p className="mt-4 font-bengali text-lg leading-relaxed text-zinc-400">
          বাংলাদেশের জনপ্রিয় সব সংবাদমাধ্যমের একই খবর এক জায়গায় হাজির করে কোন মিডিয়া খবরটা কীভাবে
          দেখছে আর দেখাচ্ছে তা আপনি সহজেই তুলনা করতে পারবেন।
        </p>
        <HeaderBanglaDate className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" />
      </section>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-800/30" />}>
        <HomeStoryGridClient />
      </Suspense>
    </div>
  );
}

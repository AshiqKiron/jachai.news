import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { lookupVerifiedClaim, type VerifiedClaim } from "@/lib/verifications";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

function verdictLabel(verdict: string): string {
  const map: Record<string, string> = {
    true: "Likely true",
    false: "Likely false",
    misleading: "Misleading",
    unverified: "Unverified",
    insufficient_evidence: "Insufficient evidence",
  };
  return map[verdict] ?? verdict;
}

export default async function VerificationDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/verify" className="text-sm text-zinc-500 hover:text-zinc-300">← New verification</Link>
      <Suspense fallback={<VerificationDetailSkeleton />}>
        <VerificationDetail slug={slug} />
      </Suspense>
    </div>
  );
}

function VerificationDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-zinc-800" />
      <header className="space-y-3">
        <div className="h-7 w-28 rounded-full bg-zinc-800" />
        <div className="h-8 w-full rounded bg-zinc-800" />
      </header>
      <div className="h-40 rounded-xl bg-zinc-800/40" />
    </div>
  );
}

async function VerificationDetail({ slug }: { slug: string }) {
  const lookup = await lookupVerifiedClaim(slug);

  if (lookup.status === "not_found") notFound();

  if (lookup.status === "unavailable") {
    return (
      <>
        <ApiDegradedBanner />
        <p className="text-sm text-zinc-400">
          We could not reach the verification API. Your claim may still exist — try again in a moment.
        </p>
      </>
    );
  }

  const claim = lookup.claim;

  return (
    <article className="space-y-6">
      <VerificationClaimBody claim={claim} />
    </article>
  );
}

function VerificationClaimBody({ claim }: { claim: VerifiedClaim }) {
  return (
    <>
      <header className="space-y-3">
        <span className="inline-block rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-wide text-zinc-400">
          {verdictLabel(claim.verdict)}
        </span>
        <h1 className="break-words font-display text-xl text-zinc-50 sm:text-2xl">{claim.claim_text}</h1>
        {claim.cache_source_id && (
          <p className="text-xs text-zinc-500">Semantic cache hit — analysis reused from a similar verified claim.</p>
        )}
      </header>
      {claim.analysis && (
        <section className="rounded-xl border border-zinc-800 bg-ink-900/40 p-5 text-sm leading-relaxed text-zinc-300">
          {claim.analysis}
        </section>
      )}
      {claim.tags && <p className="text-xs text-zinc-500">Tags: {claim.tags}</p>}
    </>
  );
}

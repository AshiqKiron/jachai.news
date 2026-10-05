import Link from "next/link";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { ClaimSearch } from "@/components/ClaimSearch";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { fetchVerifiedClaimsFeed } from "@/lib/verifications";

export const revalidate = 120;

export default async function VerifyDatabasePage() {
  const data = await fetchVerifiedClaimsFeed(30);
  const fromApi = data.fromApi;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Verified claims database</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Full-text search across indexed claims (PostgreSQL tsvector + GIN). Pages regenerate on a short ISR interval
          for fast edge delivery.
        </p>
        <Link href="/verify" className="mt-3 inline-block text-sm text-accent hover:underline">
          Submit a new claim →
        </Link>
        {!fromApi ? <div className="mt-4"><ApiDegradedBanner /></div> : null}
      </header>

      <ClientErrorBoundary title="Claim search could not load">
        <ClaimSearch />
      </ClientErrorBoundary>

      <ul className="space-y-3">
        {data.items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">
            No verified claims yet.
          </li>
        ) : (
          data.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/verify/${item.slug}`}
                className="block rounded-xl border border-zinc-800 bg-ink-900/40 p-4 hover:border-zinc-600"
              >
                <span className="text-xs uppercase text-zinc-500">{item.verdict}</span>
                <p className="mt-1 font-medium text-zinc-100">{item.claim_text}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

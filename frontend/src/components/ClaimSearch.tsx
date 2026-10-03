"use client";

import Link from "next/link";
import { useState } from "react";

import { searchVerifiedClaims, type VerifiedClaim } from "@/lib/verifications";

export function ClaimSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerifiedClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchVerifiedClaims(q);
      setResults(data.items);
      setTotal(data.total);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search verified claims…"
          className="flex-1 rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>
      {searched && (
        <p className="text-xs text-zinc-500">
          {total} match{total === 1 ? "" : "es"}
        </p>
      )}
      <ul className="space-y-2">
        {results.map((item) => (
          <li key={item.id}>
            <Link href={`/verify/${item.slug}`} className="text-sm text-zinc-300 hover:text-white">
              {item.claim_text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

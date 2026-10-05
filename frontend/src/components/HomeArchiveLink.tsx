import Link from "next/link";

/**
 * Browse CTA on home — news archive is open to all users; Pro gates analytics only.
 */
export function HomeArchiveLink() {
  return (
    <Link href="/browse" className="text-xs text-zinc-500 hover:text-zinc-300">
      Browse all →
    </Link>
  );
}

export function HomeStoriesSectionTitle() {
  return (
    <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
      Top news
    </h2>
  );
}

import Link from "next/link";

export default function VerificationDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/verify" className="text-sm text-zinc-500 hover:text-zinc-300">← New verification</Link>
      <div className="animate-pulse space-y-6">
        <header className="space-y-3">
          <div className="h-7 w-28 rounded-full bg-zinc-800" />
          <div className="h-8 w-full rounded bg-zinc-800" />
          <div className="h-4 w-2/3 rounded bg-zinc-800/60" />
        </header>
        <div className="h-40 rounded-xl bg-zinc-800/40" />
      </div>
    </div>
  );
}

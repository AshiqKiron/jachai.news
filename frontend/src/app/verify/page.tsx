import { VerifyClaimForm } from "@/components/VerifyClaimForm";

export const revalidate = 300;

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl text-zinc-50">Verify a claim</h1>
        <p className="mt-2 text-zinc-400">
          Submit viral claims for AI-assisted fact-checking. Heavy analysis runs in the background — you will see live
          progress (WebSocket), and near-duplicate claims reuse cached verdicts. URL sources are scraped in the worker.
        </p>
        <p className="mt-1 font-bengali text-sm text-zinc-500">দ্রুত যাচাই — একই দাবি আবার এলে ক্যাশ থেকে উত্তর।</p>
      </header>
      <VerifyClaimForm />
    </div>
  );
}

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { BiasMeter } from "@/components/BiasMeter";
import { getBiasSources } from "@/lib/stories";

export default async function BiasPage() {
  const { sources, fromApi } = await getBiasSources();

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="font-display text-3xl text-zinc-50">বাংলাদেশি outlet map</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Perspective lean for major Bangladeshi and Bangla-language international outlets (−1 opposition lean → +1
          establishment lean). Demo ratings until your backend seed is calibrated.
        </p>
        {!fromApi ? <div className="mt-4"><ApiDegradedBanner compact /></div> : null}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {sources.map((source) => (
          <div key={source.id} className="rounded-xl border border-zinc-800 bg-ink-900/40 p-5">
            <BiasMeter label={source.name} labelBn={source.nameBn} score={source.biasScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

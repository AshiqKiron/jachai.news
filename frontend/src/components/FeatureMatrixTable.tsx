import {
  SUBSCRIPTION_FEATURE_MATRIX,
  type TierAvailability,
} from "@/lib/subscription-features";

function AvailabilityCell({
  tier,
  note,
}: {
  tier: TierAvailability;
  note?: string;
}) {
  if (tier === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400/90">
        <span aria-hidden>✅</span>
        {note ? <span className="text-zinc-400">{note}</span> : <span>Yes</span>}
      </span>
    );
  }
  if (tier === "locked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
        <span aria-hidden>❌</span>
        {note ? <span>{note}</span> : <span>Locked</span>}
      </span>
    );
  }
  return (
    <span className="text-sm text-accent">
      {note ?? "Pro only"}
    </span>
  );
}

export function FeatureMatrixTable() {
  let lastCategory = "";

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/60">
            <th className="px-4 py-3 font-medium text-zinc-400">Category / Feature</th>
            <th className="px-4 py-3 font-medium text-zinc-400">Free</th>
            <th className="px-4 py-3 font-medium text-zinc-400">Pro</th>
          </tr>
        </thead>
        <tbody>
          {SUBSCRIPTION_FEATURE_MATRIX.map((row) => {
            const showCategory = row.category !== lastCategory;
            lastCategory = row.category;
            return (
              <tr key={row.id} className="border-b border-zinc-800/80 last:border-0">
                <td className="px-4 py-3 align-top">
                  {showCategory ? (
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                      {row.category}
                      <span className="ml-2 font-bengali normal-case tracking-normal text-zinc-700">
                        · {row.categoryBn}
                      </span>
                    </p>
                  ) : null}
                  <p className={`font-medium text-zinc-100 ${showCategory ? "mt-1" : ""}`}>
                    {row.name}
                  </p>
                  <p className="font-bengali text-xs text-zinc-500">{row.nameBn}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <AvailabilityCell tier={row.free} note={row.freeNote} />
                </td>
                <td className="px-4 py-3 align-top">
                  <AvailabilityCell tier={row.pro} note={row.proNote} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

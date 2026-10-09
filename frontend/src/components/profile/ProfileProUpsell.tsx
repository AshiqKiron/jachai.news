import Link from "next/link";

type Props = {
  titleEn: string;
  titleBn?: string;
  bodyEn: string;
  bodyBn?: string;
};

export function ProfileProUpsell({ titleEn, titleBn, bodyEn, bodyBn }: Props) {
  return (
    <section className="rounded-xl border border-dashed border-zinc-800 bg-ink-900/30 px-4 py-8 text-center">
      <p className="text-sm font-medium text-zinc-200">{titleEn}</p>
      {titleBn ? <p className="mt-0.5 font-bengali text-xs text-zinc-600">{titleBn}</p> : null}
      <p className="mt-2 text-sm text-zinc-500">{bodyEn}</p>
      {bodyBn ? <p className="mt-1 font-bengali text-xs text-zinc-600">{bodyBn}</p> : null}
      <Link
        href="/pro"
        className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white dark:text-black"
      >
        Go Pro
      </Link>
    </section>
  );
}

import type { MediaOwnership } from "@/lib/source-media-ownership";

type Props = {
  ownership: MediaOwnership | null | undefined;
  className?: string;
};

const linkClass =
  "text-zinc-400 underline decoration-zinc-600/80 underline-offset-2 hover:text-zinc-200";

export function SourceOwnershipLine({ ownership, className = "" }: Props) {
  if (!ownership) return null;

  return (
    <p className={`text-[11px] leading-snug text-zinc-500 ${className}`.trim()}>
      <span className="font-bengali text-zinc-600">মালিকানা</span>
      <span className="text-zinc-600"> · Owned by </span>
      <a
        href={ownership.owner.url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {ownership.owner.name}
      </a>
      {ownership.parent ? (
        <>
          <span className="text-zinc-600"> · Parent </span>
          <a
            href={ownership.parent.url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {ownership.parent.name}
          </a>
        </>
      ) : null}
    </p>
  );
}

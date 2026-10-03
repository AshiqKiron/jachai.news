import { DEV_BACKEND_ORIGIN } from "@/lib/api-base";

type Props = {
  /** Shorter copy for inline use under page titles */
  compact?: boolean;
};

export function ApiDegradedBanner({ compact }: Props) {
  if (compact) {
    return null;
  }

  return (
    <p
      role="status"
      className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90"
    >
      Live feed is temporarily unavailable. You&apos;re seeing demo or cached content so the app keeps working — refresh
      when the API is back, or run <code className="text-amber-200/80">npm run dev:backend</code> (
      <code className="text-amber-200/80">{DEV_BACKEND_ORIGIN.replace(/^https?:\/\//, "")}</code>
      ).
    </p>
  );
}

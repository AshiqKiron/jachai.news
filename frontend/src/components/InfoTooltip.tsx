"use client";

import { useId, useState } from "react";

type Props = {
  message: string;
  messageBn?: string;
  /** Extra classes on the outer wrapper (e.g. shrink-0). */
  className?: string;
  /** Prefer below when a parent uses overflow scroll (e.g. feature matrix). */
  placement?: "above" | "below";
};

export function InfoTooltip({
  message,
  messageBn,
  className,
  placement = "above",
}: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className={`relative inline-flex align-middle ${className ?? ""}`}>
      <button
        type="button"
        className="rounded-full p-0.5 text-zinc-500 transition hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        aria-label="More information"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253v2.501a.75.75 0 0 0 1.5 0V9.75A.75.75 0 0 0 10.5 9H9Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute left-1/2 z-50 w-max max-w-[min(18rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-left shadow-xl shadow-black/40 ${
            placement === "below"
              ? "top-full mt-2"
              : "bottom-full mb-2"
          }`}
        >
          <span className="block text-xs leading-snug text-zinc-100">{message}</span>
          {messageBn ? (
            <span className="font-bengali mt-1.5 block text-[11px] leading-snug text-zinc-400">
              {messageBn}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
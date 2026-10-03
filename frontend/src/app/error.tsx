"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { reloadOnceOnChunkError } from "@/lib/chunk-load-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    if (reloadOnceOnChunkError(error)) return;
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="font-display text-2xl text-zinc-50">Something went wrong</h1>
      <p className="text-sm leading-relaxed text-zinc-400">
        This page hit an unexpected error. Navigation and other routes should still work — try again or return home.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-zinc-600 bg-ink-900/60 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

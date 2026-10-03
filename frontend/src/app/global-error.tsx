"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { reloadOnceOnChunkError } from "@/lib/chunk-load-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (reloadOnceOnChunkError(error)) return;
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black font-sans text-zinc-100 antialiased">
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="text-2xl font-semibold">Jachai News</h1>
          <p className="mt-4 text-sm text-zinc-400">
            A critical error occurred. Reload the app or try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

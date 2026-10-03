"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { subscribeVerificationJob } from "@/lib/verification-progress";
import { submitVerification } from "@/lib/verifications";

export function VerifyClaimForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      unsubscribeRef.current?.();
    },
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProgress(null);
    setStatusMessage(null);
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setSubmitting(true);
    try {
      const result = await submitVerification({
        text: text.trim() || undefined,
        url: url.trim() || undefined,
      });
      if (!result.accepted || !result.guardrail_passed) {
        setError(result.blocked_reasons?.join(" ") || "Submission blocked.");
        return;
      }
      if (result.cached && result.slug) {
        router.push(`/verify/${result.slug}`);
        return;
      }
      if (result.job_id) {
        setProgress(5);
        setStatusMessage("Queued for verification…");
        unsubscribeRef.current = subscribeVerificationJob(result.job_id, {
          onUpdate: (payload) => {
            setProgress(payload.progress);
            setStatusMessage(payload.message ?? payload.status);
            if ((payload.status === "completed" || payload.status === "cached") && payload.slug) {
              unsubscribeRef.current?.();
              unsubscribeRef.current = null;
              router.push(`/verify/${payload.slug}`);
            }
            if (payload.status === "failed") {
              unsubscribeRef.current?.();
              unsubscribeRef.current = null;
              setError(payload.message ?? "Verification failed.");
            }
          },
          onError: (message) => setError(message),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit claim.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-ink-900/40 p-6">
      <div>
        <label className="text-sm text-zinc-400" htmlFor="claim-text">
          Claim text
        </label>
        <textarea
          id="claim-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a rumor or viral claim (English or Bangla)…"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-sm text-zinc-100"
        />
      </div>
      <div>
        <label className="text-sm text-zinc-400" htmlFor="claim-url">
          Source URL (optional)
        </label>
        <input
          id="claim-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink-950 px-3 py-2 text-sm text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-600">Fetched in the background worker — not on the submit request.</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {progress !== null && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-zinc-500">{statusMessage}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || (!text.trim() && !url.trim())}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Verify claim"}
      </button>
      <p className="text-xs text-zinc-500">
        Repeated claims may return instantly from the semantic cache. Live updates use WebSocket (SSE fallback).{" "}
        <Link href="/verify/database" className="text-zinc-400 underline hover:text-zinc-200">
          Browse verified database
        </Link>
      </p>
    </form>
  );
}

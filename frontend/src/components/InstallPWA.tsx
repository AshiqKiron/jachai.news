"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || hidden) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-zinc-700 bg-ink-900 p-4 shadow-xl md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <p className="text-sm font-medium text-zinc-100">Jachai ইনস্টল করুন</p>
      <p className="mt-1 text-xs text-zinc-400">হোম স্ক্রিনে যোগ করে দ্রুত বাংলাদেশি সংবাদ তুলনা করুন।</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
          onClick={async () => {
            await deferred.prompt();
            setHidden(true);
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400"
          onClick={() => setHidden(true)}
        >
          Later
        </button>
      </div>
    </div>
  );
}

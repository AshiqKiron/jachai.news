/** Detect Next/webpack chunk load failures (stale deploy, SW cache, dev HMR). */

export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk [\s\S]+ failed/i.test(error.message) ||
    /Failed to load chunk [\s\S]+ from runtime/i.test(error.message) ||
    /ChunkLoadError/i.test(error.message)
  );
}

const RELOAD_FLAG = "shorup:chunk-reload";

/** Reload once so a fresh HTML + chunk hashes load; returns true if reloading. */
export function reloadOnceOnChunkError(error: Error): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) {
    return false;
  }
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.removeItem(RELOAD_FLAG);
      return false;
    }
    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/** Inline in root layout — runs before React chunks (dev only). */
export const DEV_UNREGISTER_STALE_SERVICE_WORKER_SCRIPT = `
(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    regs.forEach(function (r) { r.unregister(); });
    if ("caches" in window) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) { caches.delete(k); });
      });
    }
    location.reload();
  });
})();
`.trim();

/** Client-side validation before admin source CRUD proxy calls. */

export const MIN_SOURCE_NAME_LENGTH = 2;
export const MAX_SOURCE_NAME_LENGTH = 120;
export const MAX_FEED_URL_LENGTH = 2_048;

export type AdminInputValidation = { ok: true } | { ok: false; message: string };

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateRssSourceInput(
  name: string,
  feedUrl: string,
  biasScoreRaw: string,
): AdminInputValidation {
  const trimmedName = name.trim();
  const trimmedUrl = feedUrl.trim();

  if (trimmedName.length < MIN_SOURCE_NAME_LENGTH) {
    return { ok: false, message: "Source name is required." };
  }
  if (trimmedName.length > MAX_SOURCE_NAME_LENGTH) {
    return { ok: false, message: "Source name is too long." };
  }
  if (!trimmedUrl) return { ok: false, message: "Feed URL is required." };
  if (trimmedUrl.length > MAX_FEED_URL_LENGTH) {
    return { ok: false, message: "Feed URL is too long." };
  }
  if (!isHttpUrl(trimmedUrl)) {
    return { ok: false, message: "Feed URL must start with http:// or https://." };
  }

  if (biasScoreRaw.trim() !== "") {
    const parsed = Number.parseFloat(biasScoreRaw);
    if (!Number.isFinite(parsed) || parsed < -1 || parsed > 1) {
      return { ok: false, message: "Bias score must be between -1 and 1." };
    }
  }

  return { ok: true };
}

export function buildRssSourcePayload(
  name: string,
  feedUrl: string,
  biasScoreRaw: string,
): { name: string; feed_url: string; bias_score?: number } {
  const payload: { name: string; feed_url: string; bias_score?: number } = {
    name: name.trim(),
    feed_url: feedUrl.trim(),
  };
  if (biasScoreRaw.trim() !== "") {
    payload.bias_score = Number.parseFloat(biasScoreRaw);
  }
  return payload;
}

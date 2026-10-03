/** Client-side checks before POST /verify (mirrors backend limits loosely). */

export const MIN_CLAIM_TEXT_CHARS = 12;
export const MAX_CLAIM_TEXT_CHARS = 8_000;
export const MAX_CLAIM_URL_CHARS = 2_048;

export type ClaimInputValidation =
  | { ok: true }
  | { ok: false; message: string };

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateClaimSubmission(text: string, url: string): ClaimInputValidation {
  const trimmedText = text.trim();
  const trimmedUrl = url.trim();

  if (!trimmedText && !trimmedUrl) {
    return { ok: false, message: "Enter claim text or a source URL." };
  }

  if (trimmedText.length > MAX_CLAIM_TEXT_CHARS) {
    return { ok: false, message: `Claim text must be under ${MAX_CLAIM_TEXT_CHARS} characters.` };
  }

  if (trimmedUrl) {
    if (trimmedUrl.length > MAX_CLAIM_URL_CHARS) {
      return { ok: false, message: "Source URL is too long." };
    }
    if (!isHttpUrl(trimmedUrl)) {
      return { ok: false, message: "Source URL must start with http:// or https://." };
    }
  }

  if (trimmedText && !trimmedUrl && trimmedText.length < MIN_CLAIM_TEXT_CHARS) {
    return {
      ok: false,
      message: `Add at least ${MIN_CLAIM_TEXT_CHARS} characters, or include a source URL.`,
    };
  }

  return { ok: true };
}

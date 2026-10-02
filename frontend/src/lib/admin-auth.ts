export const ADMIN_COOKIE_NAME = "jachai_admin";

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.length);
}

export async function adminSessionToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  const secret = process.env.ADMIN_SESSION_SECRET ?? password;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  return bufferToHex(signature);
}

export async function verifyAdminSession(cookieValue: string | undefined): Promise<boolean> {
  if (!isAdminPasswordConfigured()) {
    return process.env.NODE_ENV === "development";
  }
  const expected = await adminSessionToken();
  if (!cookieValue || !expected) return false;
  return timingSafeEqualHex(cookieValue, expected);
}

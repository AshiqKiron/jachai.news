export const ADMIN_COOKIE_NAME = "shorup_admin";

type AdminAuthUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

/** Comma-separated allowlist of admin emails (case-insensitive). */
export function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

export function isSupabaseAdminUser(user: AdminAuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === "admin") return true;
  return isAdminEmail(user.email);
}

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

const DEFAULT_LEGACY_ADMIN_USERNAME = "kiron";
const DEFAULT_LEGACY_ADMIN_PASSWORD = "kiron1234";

export function legacyAdminUsername(): string {
  const fromEnv = process.env.ADMIN_USERNAME?.trim();
  return fromEnv || DEFAULT_LEGACY_ADMIN_USERNAME;
}

export function legacyAdminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  return fromEnv || DEFAULT_LEGACY_ADMIN_PASSWORD;
}

export function isAdminPasswordConfigured(): boolean {
  return legacyAdminPassword().length > 0;
}

export function verifyLegacyAdminCredentials(username: string, password: string): boolean {
  return username === legacyAdminUsername() && password === legacyAdminPassword();
}

let cachedAdminSessionToken: string | undefined;

export async function adminSessionToken(): Promise<string> {
  if (cachedAdminSessionToken !== undefined) {
    return cachedAdminSessionToken;
  }

  const password = legacyAdminPassword();
  if (!password) {
    cachedAdminSessionToken = "";
    return cachedAdminSessionToken;
  }
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || password;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  cachedAdminSessionToken = bufferToHex(signature);
  return cachedAdminSessionToken;
}

export async function verifyAdminSession(cookieValue: string | undefined): Promise<boolean> {
  if (!isAdminPasswordConfigured()) {
    return false;
  }
  const expected = await adminSessionToken();
  if (!cookieValue || !expected) return false;
  return timingSafeEqualHex(cookieValue, expected);
}

export async function hasAdminAccess(
  adminCookie: string | undefined,
  user: AdminAuthUser | null | undefined,
): Promise<boolean> {
  if (await verifyAdminSession(adminCookie)) return true;
  return isSupabaseAdminUser(user);
}

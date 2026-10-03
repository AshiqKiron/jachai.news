/** Client-side validation for Supabase auth and admin account forms. */

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MIN_REGISTRATION_CODE_LENGTH = 4;
export const MAX_REGISTRATION_CODE_LENGTH = 128;

export type AuthInputValidation = { ok: true } | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): AuthInputValidation {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, message: "Email is required." };
  if (normalized.length > MAX_EMAIL_LENGTH) return { ok: false, message: "Email is too long." };
  if (!EMAIL_PATTERN.test(normalized)) return { ok: false, message: "Enter a valid email address." };
  return { ok: true };
}

function validatePassword(password: string, label = "Password"): AuthInputValidation {
  if (!password) return { ok: false, message: `${label} is required.` };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `${label} must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `${label} is too long.` };
  }
  return { ok: true };
}

export function validateDisplayName(displayName: string): AuthInputValidation {
  const trimmed = displayName.trim();
  if (!trimmed) return { ok: true };
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false, message: `Display name must be under ${MAX_DISPLAY_NAME_LENGTH} characters.` };
  }
  return { ok: true };
}

export function validateSignInCredentials(email: string, password: string): AuthInputValidation {
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return emailCheck;
  return validatePassword(password);
}

export function validateSignUpFields(
  email: string,
  password: string,
  displayName: string,
): AuthInputValidation {
  const nameCheck = validateDisplayName(displayName);
  if (!nameCheck.ok) return nameCheck;
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) return emailCheck;
  return validatePassword(password);
}

export function validateAdminRegistration(
  email: string,
  password: string,
  displayName: string,
  registrationCode: string,
): AuthInputValidation {
  const code = registrationCode.trim();
  if (!code) return { ok: false, message: "Registration code is required." };
  if (code.length < MIN_REGISTRATION_CODE_LENGTH) {
    return { ok: false, message: "Registration code looks too short." };
  }
  if (code.length > MAX_REGISTRATION_CODE_LENGTH) {
    return { ok: false, message: "Registration code is too long." };
  }
  return validateSignUpFields(email, password, displayName);
}

export function validateOpsPassword(password: string): AuthInputValidation {
  return validatePassword(password, "Ops password");
}

export function validateAdminSignInCredentials(username: string, password: string): AuthInputValidation {
  const user = username.trim();
  if (!user) return { ok: false, message: "Username is required." };
  if (user.length > 64) return { ok: false, message: "Username is too long." };
  return validatePassword(password, "Password");
}

/** Prevent open redirects from ?next= on sign-in / admin login. */
export function safeAuthRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("\0")) return fallback;
  return trimmed;
}

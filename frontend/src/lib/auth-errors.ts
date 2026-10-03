export function formatAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in. Check your inbox.";
  }
  if (normalized.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  return message;
}

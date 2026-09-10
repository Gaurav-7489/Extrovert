import { createClient } from "@/lib/supabase/client";
import { routes } from "@/config/routes";

export type AuthResult =
  | { success: true; needsEmailConfirmation?: boolean }
  | { success: false; error: string };

let cachedClient: ReturnType<typeof createClient> | null = null;
function getClient() { if (!cachedClient) cachedClient = createClient(); return cachedClient; }
function getAuthCallbackUrl(next: string = routes.app) { return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`; }
function getEmailConfirmationUrl(next: string = routes.app) { return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`; }
function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) { const message = (error as { message?: unknown }).message; if (typeof message === "string" && message.trim()) return message; }
  return fallback;
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try { const { error } = await getClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthCallbackUrl(routes.app) } }); if (error) return { success: false, error: error.message }; return { success: true }; }
  catch (error) { return { success: false, error: getErrorMessage(error, "Google sign-in is temporarily unavailable.") }; }
}

export async function registerWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { success: false, error: "Enter a valid email address." };
  if (password.length < 8) return { success: false, error: "Use a password with at least 8 characters." };
  try {
    const { data, error } = await getClient().auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: getEmailConfirmationUrl(routes.app) } });
    if (error) return { success: false, error: getErrorMessage(error, "Unable to create your account.") };
    if (!data.user) return { success: false, error: "Unable to create your account. Please try again." };
    return { success: true, needsEmailConfirmation: !data.session };
  } catch (error) { console.error("Registration failed:", error); return { success: false, error: getErrorMessage(error, "Authentication service is temporarily unavailable.") }; }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { success: false, error: "Enter a valid email address." };
  if (password.length < 8) return { success: false, error: "Use a password with at least 8 characters." };
  try {
    const { data, error } = await getClient().auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) { const message = error.message.toLowerCase().includes("invalid login credentials") ? "Incorrect email or password." : error.message; return { success: false, error: message }; }
    if (!data.user) return { success: false, error: "We could not start your session. Please try again." };
    return { success: true };
  } catch (error) { return { success: false, error: getErrorMessage(error, "Authentication service is temporarily unavailable.") }; }
}

export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { success: false, error: "Enter a valid email address." };
  try { const { error } = await getClient().auth.resend({ type: "signup", email: normalizedEmail, options: { emailRedirectTo: getEmailConfirmationUrl(routes.app) } }); return error ? { success: false, error: error.message } : { success: true }; }
  catch (error) { return { success: false, error: getErrorMessage(error, "Unable to resend the verification email.") }; }
}

export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { success: false, error: "Enter a valid email address." };
  try { const { error } = await getClient().auth.resetPasswordForEmail(normalizedEmail, { redirectTo: getEmailConfirmationUrl(routes.resetPassword) }); return error ? { success: false, error: error.message } : { success: true }; }
  catch (error) { return { success: false, error: getErrorMessage(error, "Unable to send the password reset email.") }; }
}

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "email_change",
  "invite",
  "magiclink",
  "signup",
]);

function safeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type") as EmailOtpType | null;
  const type = rawType && ALLOWED_TYPES.has(rawType) ? rawType : null;

  const fallback = type === "recovery" ? routes.resetPassword : routes.verify;
  const next = safeNext(url.searchParams.get("next"), fallback);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`${routes.login}?error=invalid_verification_link`, url.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    console.error("Auth confirmation error:", error.message);
    return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}error=verification_failed`, url.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`${routes.login}?error=session_failed`, url.origin));

  if (type === "email" || type === "signup" || type === "email_change") {
    const { data: identity, error: identityError } = await supabase
      .from("extrovert_profiles")
      .select("profile_completed,trust_state")
      .eq("id", user.id)
      .maybeSingle();

    if (identityError) {
      console.error("Could not load Extrovert identity after email verification:", identityError.message);
      return NextResponse.redirect(new URL(`${routes.login}?error=profile_load_failed`, url.origin));
    }

    if (identity?.trust_state === "banned") {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.redirect(new URL(`${routes.login}?error=account_restricted`, url.origin));
    }

    if (type !== "email_change" && !identity?.profile_completed) {
      return NextResponse.redirect(new URL(`${routes.onboarding}?next=${encodeURIComponent(next)}`, url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

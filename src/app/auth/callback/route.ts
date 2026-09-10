import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";

export const dynamic = "force-dynamic";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return routes.app;
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code")?.trim();
  const oauthError = requestUrl.searchParams.get("error");
  const next = safeNext(requestUrl.searchParams.get("next"));

  if (oauthError) {
    return NextResponse.redirect(new URL(`${routes.login}?error=google_${encodeURIComponent(oauthError)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${routes.login}?error=missing_code`, requestUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("OAuth code exchange failed:", exchangeError.message);
    return NextResponse.redirect(new URL(`${routes.login}?error=oauth_exchange_failed`, requestUrl.origin));
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL(`${routes.login}?error=session_failed`, requestUrl.origin));

  const { data: identity, error: identityError } = await supabase
    .from("extrovert_profiles")
    .select("profile_completed,trust_state")
    .eq("id", user.id)
    .maybeSingle();

  if (identityError) {
    console.error("Could not load Extrovert identity after OAuth:", identityError.message);
    return NextResponse.redirect(new URL(`${routes.login}?error=profile_load_failed`, requestUrl.origin));
  }

  if (identity?.trust_state === "banned") {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL(`${routes.login}?error=account_restricted`, requestUrl.origin));
  }

  if (!identity?.profile_completed) {
    return NextResponse.redirect(new URL(`${routes.onboarding}?next=${encodeURIComponent(next)}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

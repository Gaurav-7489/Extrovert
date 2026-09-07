import { NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL(`${routes.login}?error=missing_code`, requestUrl.origin));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Google auth callback error:", error.message);
    return NextResponse.redirect(new URL(`${routes.login}?error=signin_failed`, requestUrl.origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`${routes.login}?error=session_failed`, requestUrl.origin));

  const { data: identity, error: identityError } = await supabase
    .from("extrovert_profiles")
    .select("profile_completed,trust_state")
    .eq("id", user.id)
    .maybeSingle();
  if (identityError) return NextResponse.redirect(new URL(`${routes.login}?error=profile_check_failed`, requestUrl.origin));
  if (identity?.trust_state === "banned") {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL(`${routes.login}?error=account_restricted`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(identity?.profile_completed ? routes.app : routes.onboarding, requestUrl.origin));
}

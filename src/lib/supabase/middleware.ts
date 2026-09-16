import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routes } from "@/config/routes";
import { canAccessAdmin, getEffectiveRole } from "@/lib/auth/authorization";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === routes.login || pathname === routes.register;
  const isOnboardingRoute = pathname === routes.onboarding;
  const isAppRoute = pathname === routes.app || pathname.startsWith("/app/");
  const isAdminRoute = pathname === routes.admin.root || pathname.startsWith("/admin/");
  const isFaceVerifyRoute = pathname === routes.verifyFace;

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.headers.set("Cache-Control", "private, no-store");
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Preserve refreshed/cleared session cookies across navigation redirects.
  function redirectTo(path: string) {
    const response = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  supabaseResponse.headers.set("Cache-Control", "private, no-store");

  let userId: string | null = null;
  try {
    // Use the same authenticated-user check as Server Components instead of
    // trusting locally decoded claims. This prevents stale/expired sessions
    // from creating /login <-> /onboarding redirect loops on mobile browsers.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
        supabaseResponse.cookies.delete(cookie.name);
      }
    }
    userId = null;
  }

  if (!userId && (isAppRoute || isAdminRoute || isFaceVerifyRoute || isOnboardingRoute)) {
    return redirectTo(routes.login);
  }

  if (!userId) return supabaseResponse;

  // AppLayout already performs the authenticated profile/trust checks for /app routes.
  // Avoid repeating the same Supabase profile query in middleware on every app navigation.
  if (isAppRoute) return supabaseResponse;

  const { data: extrovertProfile } = await supabase
    .from("extrovert_profiles")
    .select("profile_completed,trust_state")
    .eq("id", userId)
    .maybeSingle();

  if (extrovertProfile?.trust_state === "banned") {
    await supabase.auth.signOut({ scope: "local" });
    return redirectTo(`${routes.login}?error=account_restricted`);
  }

  if (pathname === routes.resetPassword) return supabaseResponse;

  if (!extrovertProfile?.profile_completed && !isOnboardingRoute) {
    return redirectTo(routes.onboarding);
  }

  if (isOnboardingRoute) return supabaseResponse;

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    const role = getEffectiveRole(userId, profile?.role);
    if (!canAccessAdmin(role)) {
      return redirectTo(routes.app);
    }
  }

  if (isAuthRoute) return redirectTo(routes.app);
  return supabaseResponse;
}

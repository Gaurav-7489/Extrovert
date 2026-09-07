import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { AppNavbar } from "@/components/layout/app-navbar";
import { DatingBottomNav } from "@/components/layout/dating-bottom-nav";
import { MessageKeyBootstrap } from "@/components/security/message-key-bootstrap";
import { LazyGlobalFeatures } from "@/components/layout/lazy-global-features";
import { canAccessAdmin, getEffectiveRole } from "@/lib/auth/authorization";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const userEmail = typeof claims?.email === "string" ? claims.email : "Unknown";
  if (!userId) redirect(routes.login);

  const [{ data: extrovertProfile }, { data: profile }] = await Promise.all([
    supabase.from("extrovert_profiles").select("profile_completed,trust_state").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
  ]);

  if (!extrovertProfile?.profile_completed) redirect(routes.onboarding);
  if (extrovertProfile.trust_state === "banned") redirect(routes.login);

  const role = getEffectiveRole(userId, profile?.role);
  const canOpenAdmin = canAccessAdmin(role);

  return (
    <div className="flex min-h-[100dvh] w-full justify-center overflow-hidden bg-[#060608] dark:bg-[#060608]">
      <div className="mobile-frame relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white text-zinc-950 shadow-2xl sm:ring-1 sm:ring-zinc-200/80 dark:bg-[#0a0a0c] dark:text-zinc-100 dark:sm:ring-white/10">
        <AppNavbar userEmail={userEmail} isSuperAdmin={canOpenAdmin} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[80px] [-webkit-overflow-scrolling:touch]">
          {children}
        </main>
        <DatingBottomNav />
        <LazyGlobalFeatures />
        <MessageKeyBootstrap userId={userId} />
      </div>
    </div>
  );
}
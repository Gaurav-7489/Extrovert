import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { AppNavbar } from "@/components/layout/app-navbar";
import { DatingBottomNav } from "@/components/layout/dating-bottom-nav";
import { MessageKeyBootstrap } from "@/components/security/message-key-bootstrap";
import { LazyGlobalFeatures } from "@/components/layout/lazy-global-features";
import { canAccessAdmin, getEffectiveRole } from "@/lib/auth/authorization";
import { MobileViewportSync } from "@/components/layout/mobile-viewport-sync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  const [{ data: extrovertProfile }, { data: profile }] = await Promise.all([
    supabase
      .from("extrovert_profiles")
      .select("profile_completed,trust_state")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  if (!extrovertProfile?.profile_completed) redirect(routes.onboarding);
  if (extrovertProfile.trust_state === "banned") redirect(routes.login);

  const role = getEffectiveRole(user.id, profile?.role);
  const canOpenAdmin = canAccessAdmin(role);

  return (
    <div className="app-viewport-shell flex w-full overflow-hidden bg-background text-foreground">
      <MobileViewportSync />
      <div className="mobile-frame relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground">
        <AppNavbar userEmail={user.email ?? ""} isSuperAdmin={canOpenAdmin} />
        <main className="app-scroll-region min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-transparent text-foreground no-scrollbar [-webkit-overflow-scrolling:touch]">
          {children}
        </main>
        <DatingBottomNav />
        <LazyGlobalFeatures />
        <MessageKeyBootstrap userId={user.id} />
      </div>
    </div>
  );
}

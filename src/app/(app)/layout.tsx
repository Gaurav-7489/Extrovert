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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const [{ data: extrovertProfile }, { data: profile }] = await Promise.all([
    supabase.from("extrovert_profiles").select("profile_completed,trust_state").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  if (!extrovertProfile?.profile_completed) redirect(routes.onboarding);
  if (extrovertProfile.trust_state === "banned") redirect(routes.login);

  const role = getEffectiveRole(user.id, profile?.role);
  const canOpenAdmin = canAccessAdmin(role);

  return (
    <div className="flex min-h-[100dvh] w-full justify-center overflow-hidden bg-background text-foreground">
      <div className="mobile-frame relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-background text-foreground shadow-2xl sm:ring-1 sm:ring-zinc-200/80 dark:sm:ring-white/10">
        <AppNavbar userEmail={user.email ?? ""} isSuperAdmin={canOpenAdmin} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-background pb-[80px] text-foreground [-webkit-overflow-scrolling:touch]">{children}</main>
        <DatingBottomNav />
        <LazyGlobalFeatures />
        <MessageKeyBootstrap userId={user.id} />
      </div>
    </div>
  );
}

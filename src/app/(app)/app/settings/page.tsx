import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { SettingsPanels } from "./settings-panels";
import { signOut } from "@/app/(app)/actions";
import {
  ExternalLink,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export const metadata: Metadata = { title: "Settings | Extrovert" };
export const dynamic = "force-dynamic";

function TrustBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold shadow-2xs ${ok ? "border-[#550000]/40 bg-[#550000]/20 text-red-300" : "border-white/10 bg-[#16161d] text-zinc-400"}`}>
      <ShieldCheck className="h-2.5 w-2.5" />
      <span>{ok ? yes : no}</span>
    </span>
  );
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const authProviders = (user.identities ?? []).map((i) => i.provider);
  const hasPassword = authProviders.includes("email");

  const { data: identity } = await supabase.from("extrovert_profiles").select("display_name,gender,area_id,department,academic_year,verification_status,area_verification_status,trust_state").eq("id", user.id).maybeSingle();

  const [{ data: preferences }, { data: profile }, { data: blocks }, { data: subscription }, { data: isPro }] = await Promise.all([
    supabase.from("dating_preferences").select("interested_in,min_age,max_age,preferred_department").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("ghost_mode").eq("id", user.id).maybeSingle(),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("is_datebu_pro"),
  ]);

  const { data: area } = identity?.area_id
    ? await supabase.from("extrovert_areas").select("name").eq("id", identity.area_id).maybeSingle()
    : { data: null };

  const blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  let blockedUsers: { id: string; display_name: string; department: string }[] = [];
  if (blockedIds.length) {
    const { data } = await supabase.from("profiles").select("id,display_name,department").in("id", blockedIds);
    blockedUsers = (data ?? []).map((p) => ({ id: p.id, display_name: p.display_name, department: p.department }));
  }

  const rawShowMe = preferences?.interested_in?.[0];
  const showMe = preferences?.interested_in?.includes("everyone") || (preferences?.interested_in?.includes("men") && preferences?.interested_in?.includes("women"))
    ? "Everyone"
    : rawShowMe
      ? rawShowMe.replace("nonbinary", "Non-binary / Other").replace(/^./, (c: string) => c.toUpperCase())
      : "Everyone";

  return (
    <main className="mx-auto w-full max-w-md px-3.5 pb-28 pt-4 font-sans text-zinc-50 sm:px-4">
      <header className="mb-4 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">ACCOUNT</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">Manage your identity, matching preferences, privacy, and account security.</p>
      </header>

      <section className="mb-3.5 rounded-[1.75rem] border border-[#550000]/30 bg-[#550000]/15 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#550000] text-white shadow-2xs"><ShieldCheck className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">Trust snapshot</p>
            <h2 className="mt-0.5 truncate text-sm font-bold text-zinc-50 sm:text-base">{identity?.display_name || "Your Extrovert profile"}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-300"><MapPin className="h-3 w-3 shrink-0 text-red-400" /><span className="truncate">{area?.name || "Area not set"}{identity?.department ? ` · ${identity.department}` : ""}</span></p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <TrustBadge ok={identity?.verification_status === "verified"} yes="Face verified" no="Face not verified" />
              <TrustBadge ok={identity?.area_verification_status === "verified"} yes="Area verified" no="Area not verified" />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-[#550000]/25 pt-1">
              <Link href={routes.identityVerification} className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:underline"><span>Face + area verification</span><ExternalLink className="h-3 w-3" /></Link>
              <Link href={routes.profileSetup} className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:underline"><span>Edit dating profile</span><ExternalLink className="h-3 w-3" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-3.5 rounded-[1.75rem] border border-white/10 bg-[#121216] p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400"><SlidersHorizontal className="h-3.5 w-3.5 text-red-400" /><span>Dating & matching</span></p>
            <p className="mt-0.5 text-xs text-zinc-400">Your active discovery filter controls.</p>
          </div>
          <Link href={routes.profileSetup} className="rounded-xl border border-[#550000]/30 bg-[#550000]/20 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-[#550000]/30">Edit</Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/5 bg-[#16161d] p-2.5 text-center"><span className="block text-[9px] font-bold uppercase text-zinc-500">Show me</span><span className="mt-1 block truncate text-xs font-bold text-zinc-100">{showMe}</span></div>
          <div className="rounded-2xl border border-white/5 bg-[#16161d] p-2.5 text-center"><span className="block text-[9px] font-bold uppercase text-zinc-500">Age</span><span className="mt-1 block text-xs font-bold text-zinc-100">{preferences?.min_age ?? 18}–{preferences?.max_age ?? 30}</span></div>
          <div className="rounded-2xl border border-white/5 bg-[#16161d] p-2.5 text-center"><span className="block text-[9px] font-bold uppercase text-zinc-500">Field</span><span className="mt-1 block truncate text-xs font-bold text-zinc-100">{preferences?.preferred_department || "All"}</span></div>
        </div>
      </section>

      <SettingsPanels currentEmail={user.email ?? ""} hasPassword={hasPassword} initialGhostMode={Boolean(profile?.ghost_mode)} blockedUsers={blockedUsers} subscription={{ plan: subscription?.plan ?? "free", status: subscription?.status ?? "inactive", currentPeriodEnd: subscription?.current_period_end ?? null }} isPro={Boolean(isPro)} />

      <section className="mt-3.5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#121216] shadow-2xs">
        <div className="border-b border-white/5 bg-[#16161d] px-4 py-3"><span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400"><Lock className="h-3 w-3 text-red-400" /><span>Safety & Support</span></span></div>
        <Link href={routes.support} className="flex items-center justify-between border-b border-white/5 p-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"><span>Support Center</span><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /></Link>
        <Link href={routes.feedback} className="flex items-center justify-between border-b border-white/5 p-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"><span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-red-400" /><span>Contact & Feedback</span></span><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /></Link>
        <Link href={routes.safety} className="flex items-center justify-between border-b border-white/5 p-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"><span>Safety Guidelines</span><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /></Link>
        <Link href={routes.privacy} className="flex items-center justify-between border-b border-white/5 p-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"><span>Privacy & Data Rights</span><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /></Link>
        <Link href={routes.terms} className="flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"><span>Terms of Service</span><ExternalLink className="h-3.5 w-3.5 text-zinc-400" /></Link>
      </section>

      <form action={signOut} className="mt-3.5"><button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-900/40 bg-rose-950/20 text-xs font-bold text-rose-300 hover:bg-rose-950/40"><LogOut className="h-4 w-4" /><span>Sign out securely</span></button></form>
    </main>
  );
}

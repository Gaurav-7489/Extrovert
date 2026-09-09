import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import FaceVerification from "@/components/verification/face-verification";
import AreaVerification from "@/components/verification/area-verification";

export const dynamic = "force-dynamic";

export default async function FaceVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const params = await searchParams;
  const { data: profile, error: profileError } = await supabase
    .from("extrovert_profiles")
    .select("verification_status,area_verification_status,area_id,profile_completed")
    .eq("id", user.id)
    .maybeSingle();

  // Face verification is optional and is deliberately allowed before the
  // required onboarding fields are submitted. Only a missing profile row is
  // an actual prerequisite; an incomplete profile is not.
  if (profileError || !profile) redirect(routes.onboarding);

  const verified = profile.verification_status === "verified";
  const { data: area } = profile.area_id
    ? await supabase.from("extrovert_areas").select("name").eq("id", profile.area_id).maybeSingle()
    : { data: null };

  return (
    <main className="min-h-[100dvh] bg-[#0a0a0c] px-3.5 py-5 font-sans text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between px-1">
          <Link href={routes.onboarding} className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-400">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to setup</span>
          </Link>
          {!verified && (
            <Link href={routes.onboarding} className="text-xs font-bold text-zinc-400 hover:text-zinc-200">
              Skip for later
            </Link>
          )}
        </div>

        {params.error && <div className="mb-4 rounded-2xl border border-rose-900/40 bg-rose-950/25 p-3 text-xs font-semibold text-rose-300">{params.error}</div>}

        <section className="rounded-[2rem] border border-white/10 bg-[#121216] p-5 shadow-xl sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400">EXTROVERT · TRUST</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Verification</h1>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">Face verification is optional. Complete it now for the verified badge, or skip it and finish later from your account.</p>
            </div>
          </div>

          {verified ? (
            <div className="mt-5 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /><p className="text-sm font-bold">Face verified</p></div>
              <p className="mt-1.5 text-[11px] leading-4 text-emerald-400/80">Your live-camera face check is complete. No identity card or document is required.</p>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-4 rounded-2xl border border-white/5 bg-[#181820] p-4">
                <p className="text-xs font-bold text-zinc-100">Face verification</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">A brief live camera challenge confirms a real person is behind the account. Camera frames stay on your device.</p>
              </div>
              <FaceVerification />
            </div>
          )}

          <AreaVerification initialStatus={profile.area_verification_status ?? "pending"} areaName={area?.name ?? null} />
        </section>

        <Link href={routes.onboarding} className="mt-3 flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-[#121216] text-xs font-bold text-zinc-300 hover:bg-[#16161d]">{verified ? "Back to setup" : "Skip verification for now"}</Link>
      </div>
    </main>
  );
}

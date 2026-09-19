import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";
import { saveIdentity } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: identity, error: identityError } = await supabase
    .from("extrovert_profiles")
    .select("display_name,date_of_birth,gender,department,academic_year,identity_type,institution_name,field_of_study,job_title,employer_name,role_description,verification_status,profile_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (identityError) throw new Error("We could not load your onboarding profile. Please try again.");
  if (identity?.profile_completed) redirect(routes.app);

  const metadata = user.user_metadata ?? {};
  const defaultName = identity?.display_name || metadata.full_name || metadata.name || "";
  const verified = identity?.verification_status === "verified";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#07080b] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-zinc-50 supports-[height:100dvh]:min-h-[100dvh]">
      <div className="pointer-events-none absolute -left-24 top-28 h-64 w-64 rounded-full bg-[rgb(var(--brand-red)/.08)] blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <BrandLogo size={32} />

        <div className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--brand-red)/.18)] bg-[rgb(var(--brand-red)/.08)] px-3 py-1.5 text-[10px] font-extrabold text-[rgb(var(--brand-red))]">
          <Sparkles className="h-3.5 w-3.5" />
          FIRST IMPRESSION
        </div>

        <h1 className="mt-4 text-[34px] font-black leading-[1] tracking-[-.055em]">
          Make your profile feel like you.
        </h1>
        <p className="mt-3 max-w-[34ch] text-[12px] leading-5 text-zinc-400">
          Give people enough context to start a real conversation. You can fine-tune the rest once you’re inside.
        </p>

        <div className="mt-5 rounded-[22px] border border-[rgb(var(--brand-red)/.14)] bg-[rgb(var(--brand-red)/.07)] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-[rgb(var(--brand-red)/.12)] text-[rgb(var(--brand-red))]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold">
                {verified ? "You’re face verified" : "Verification is your call"}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                {verified
                  ? "Your live-camera check is complete and your trust signal is active."
                  : "After the basics, you can run a short live-camera check for a trust badge. No government ID upload is required."}
              </p>
            </div>
          </div>
        </div>

        <form id="identity-form" action={saveIdentity} className="mt-6 space-y-3.5">
          <label className="block">
            <span className="text-[11px] font-extrabold text-zinc-300">What should people call you?</span>
            <input name="display_name" required maxLength={80} defaultValue={defaultName} autoComplete="name" placeholder="Your name" className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-4 text-sm text-white outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold text-zinc-300">Date of birth</span>
            <input name="date_of_birth" required type="date" defaultValue={identity?.date_of_birth ?? ""} className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-4 text-sm text-white outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold text-zinc-300">Gender</span>
            <select name="gender" required defaultValue={identity?.gender ?? ""} className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-4 text-sm text-white outline-none">
              <option value="" disabled>Select gender</option>
              <option value="man">Man</option>
              <option value="woman">Woman</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold text-zinc-300">What best describes you?</span>
            <select name="identity_type" required defaultValue={identity?.identity_type ?? "student"} className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-4 text-sm text-white outline-none">
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="text-[10px] font-extrabold text-zinc-300">Field / work</span>
              <input name="department" maxLength={100} defaultValue={identity?.department ?? ""} placeholder="Design, sales…" className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-3 text-xs text-white outline-none" />
            </label>
            <label className="block">
              <span className="text-[10px] font-extrabold text-zinc-300">Education</span>
              <select name="academic_year" defaultValue={identity?.academic_year ?? "postgraduate"} className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-3 text-xs text-white outline-none">
                <option value="1st-year">Early college</option>
                <option value="2nd-year">College</option>
                <option value="3rd-year">College</option>
                <option value="4th-year">College</option>
                <option value="5th-year">Integrated</option>
                <option value="postgraduate">Postgraduate</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-extrabold text-zinc-300">College, company, or organisation <span className="font-medium text-zinc-600">(optional)</span></span>
            <input name="institution_name" maxLength={160} defaultValue={identity?.institution_name ?? ""} placeholder="Add some context" className="mt-1.5 h-12 w-full rounded-[16px] border border-white/[.085] bg-white/[.035] px-4 text-sm text-white outline-none" />
          </label>

          <button type="submit" className="extrovert-brand-glow mt-2 flex h-12 w-full items-center justify-center rounded-[18px] bg-[rgb(var(--brand-red))] text-sm font-black text-white">
            Build my Extrovert profile
          </button>
        </form>

        <p className="mt-4 text-center text-[9px] leading-4 text-zinc-600">
          Extrovert is for adults 18 and older.
        </p>
      </div>
    </main>
  );
}

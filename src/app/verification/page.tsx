import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import FaceVerification from "@/components/verification/face-verification";

export const dynamic = "force-dynamic";

export default async function FaceVerificationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const params = await searchParams;
  const { data: profile } = await supabase
    .from("extrovert_profiles")
    .select("verification_status")
    .eq("id", user.id)
    .maybeSingle();
  const verified = profile?.verification_status === "verified";

  return (
    <main className="min-h-[100dvh] bg-[#f7fbf9] px-4 py-6 font-sans text-zinc-950">
      <div className="mx-auto w-full max-w-lg">
        <Link href={routes.onboarding} className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-emerald-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to setup
        </Link>

        {params.error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{params.error}</div>}

        {verified ? (
          <section className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">EXTROVERT · VERIFIED</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">You’re verified.</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">A live-camera face check has been completed for this account. No government ID is involved.</p>
            <Link href={routes.onboarding} className="mt-6 flex h-11 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-black text-white">Continue setup</Link>
          </section>
        ) : (
          <>
            <div className="mb-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><p className="text-sm font-black">Keep Extrovert human</p></div>
              <h1 className="mt-3 text-2xl font-black tracking-tight">Quick face check</h1>
              <p className="mt-2 text-xs leading-5 text-zinc-600">No KYC. No Aadhaar. No PAN. No DigiLocker. Just a short camera check to confirm a live person is behind the account.</p>
            </div>
            <FaceVerification />
            <Link href={routes.onboarding} className="mt-3 flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700">Skip for now</Link>
          </>
        )}
      </div>
    </main>
  );
}

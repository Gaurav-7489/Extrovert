import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import FaceVerification from "@/components/verification/face-verification";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const dynamic = "force-dynamic";

export default async function FaceVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const params = await searchParams;
  const { data: profile } = await supabase
    .from("extrovert_profiles")
    .select("verification_status")
    .eq("id", user.id)
    .maybeSingle();

  const verified = profile?.verification_status === "verified";

  return (
    <main className="min-h-[100dvh] bg-white px-3.5 py-5 font-sans text-zinc-950 transition-colors dark:bg-[#0a0a0c] dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between px-1">
          <Link
            href={routes.onboarding}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-[#550000] dark:text-zinc-400 dark:hover:text-red-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to setup</span>
          </Link>
          <ThemeToggle compact />
        </div>

        {params.error && (
          <div className="mb-4 rounded-2xl border border-rose-200/90 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700 shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300">
            {params.error}
          </div>
        )}

        {verified ? (
          <section className="rounded-[2rem] border border-[#550000]/25 bg-white p-6 shadow-xl transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-black/60">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#550000]/20 bg-[#550000]/10 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#550000] dark:text-red-400">
              DATEBU · VERIFIED
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              You&apos;re verified.
            </h1>

            <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
              A short live-camera check confirms an authentic person is behind
              your account. No identity card or document is required.
            </p>

            <Link
              href={routes.onboarding}
              className="mt-6 flex h-12 items-center justify-center rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] dark:bg-[#550000] dark:hover:bg-[#6e0303]"
            >
              Continue setup
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-4 rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#550000] dark:text-red-400" />

                <p className="text-xs font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
                  Keep DateBu authentic
                </p>
              </div>

              <h1 className="mt-2.5 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                Quick face check
              </h1>

              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                No government ID card or DigiLocker upload needed. Just a brief
                live camera challenge to confirm a real person is behind the
                account.
              </p>
            </div>

            <FaceVerification />

            <Link
              href={routes.onboarding}
              className="mt-3 flex h-11 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white text-xs font-bold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-[0.98] dark:border-white/10 dark:bg-[#121216] dark:text-zinc-300 dark:hover:bg-[#16161d]"
            >
              Skip for now
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
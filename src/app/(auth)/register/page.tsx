import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { LoginGoogle } from "@/components/login-google";
import BrandLogo from "@/components/BrandLogo";
import { routes } from "@/config/routes";

export default function RegisterPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#07080b] px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-zinc-50">
      <div className="pointer-events-none absolute -right-24 top-14 h-64 w-64 rounded-full bg-[rgb(var(--brand-red)/.11)] blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <Link href={routes.home} className="pressable" aria-label="Extrovert home">
            <BrandLogo size={34} />
          </Link>
          <Link href={routes.login} className="pressable grid h-10 w-10 place-items-center rounded-[15px] border border-white/[.075] bg-white/[.035] text-zinc-400" aria-label="Back to sign in">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-auto py-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--brand-red)/.18)] bg-[rgb(var(--brand-red)/.08)] px-3 py-1.5 text-[10px] font-extrabold text-[rgb(var(--brand-red))]">
            <Sparkles className="h-3.5 w-3.5" />
            NEW HERE?
          </div>

          <h1 className="mt-5 text-[42px] font-black leading-[.98] tracking-[-.06em]">
            One tap.
            <br />
            Then you’re in.
          </h1>

          <p className="mt-4 max-w-[31ch] text-[13px] leading-6 text-zinc-400">
            Start with Google, build your Extrovert profile, and choose how you want to show up — social, dating, or both.
          </p>

          <div className="extrovert-surface mt-6 rounded-[26px] p-4">
            <LoginGoogle label="Continue with Google" />

            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--brand-red))]" />
              <p className="text-[10px] leading-4 text-zinc-500">
                Google verifies the account. Extrovert never receives or stores your Google password.
              </p>
            </div>

            <p className="mt-4 text-center text-[9px] leading-4 text-zinc-600">
              By continuing, you agree to the{" "}
              <Link href={routes.terms} className="font-bold text-zinc-400">Terms</Link>
              {" "}and{" "}
              <Link href={routes.privacy} className="font-bold text-zinc-400">Privacy Policy</Link>.
            </p>
          </div>
        </section>

        <p className="mt-auto text-center text-[11px] text-zinc-500">
          Already on Extrovert?{" "}
          <Link href={routes.login} className="font-extrabold text-[rgb(var(--brand-red))]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

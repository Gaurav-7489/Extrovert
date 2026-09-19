import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShieldCheck, Sparkles, Users } from "lucide-react";
import { LoginGoogle } from "@/components/login-google";
import BrandLogo from "@/components/BrandLogo";
import { routes } from "@/config/routes";

const oauthErrors: Record<string, string> = {
  missing_code: "Google did not return a sign-in code. Please try again.",
  oauth_exchange_failed: "We could not complete Google sign-in. Please try again.",
  session_failed: "Your Google session could not be started. Please try again.",
  profile_load_failed: "Your account was connected, but your profile could not be loaded.",
  account_restricted: "This account is currently restricted.",
};

const signals = [
  { icon: Users, label: "Social + dating" },
  { icon: ShieldCheck, label: "Trust controls" },
  { icon: LockKeyhole, label: "Private by design" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = rawError?.startsWith("google_")
    ? "Google sign-in was cancelled or denied. Please try again."
    : rawError
      ? oauthErrors[rawError] ?? "Google sign-in could not be completed. Please try again."
      : null;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#07080b] px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-zinc-50">
      <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-[rgb(var(--brand-red)/.12)] blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col">
        <Link href={routes.home} className="pressable w-fit rounded-2xl py-1" aria-label="Back to Extrovert home">
          <BrandLogo size={34} />
        </Link>

        <section className="mt-auto pt-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--brand-red)/.18)] bg-[rgb(var(--brand-red)/.08)] px-3 py-1.5 text-[10px] font-extrabold text-[rgb(var(--brand-red))]">
            <Sparkles className="h-3.5 w-3.5" />
            WELCOME BACK
          </div>

          <h1 className="mt-5 text-[42px] font-black leading-[.98] tracking-[-.06em]">
            Your next hello
            <br />
            starts here.
          </h1>

          <p className="mt-4 max-w-[31ch] text-[13px] leading-6 text-zinc-400">
            One Google account. One Extrovert identity. Discover people, make plans, match, and chat from the same place.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {signals.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-[18px] border border-white/[.075] bg-white/[.03] px-2 py-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-[rgb(var(--brand-red))]" />
                <p className="mt-2 text-[9px] font-bold leading-3 text-zinc-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="extrovert-surface mt-5 rounded-[26px] p-4">
            <LoginGoogle />

            {errorMessage ? (
              <p role="alert" className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-[11px] font-semibold leading-5 text-rose-300">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--brand-red))]" />
              <p className="text-[10px] leading-4 text-zinc-500">
                Google handles authentication securely. Extrovert never receives or stores your Google password.
              </p>
            </div>
          </div>

          <Link
            href={routes.about}
            className="mx-auto mt-5 flex w-fit items-center gap-1.5 text-[10px] font-extrabold text-zinc-400"
          >
            See what Extrovert is about
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </section>

        <footer className="mt-auto pt-8">
          <div className="flex items-center justify-center gap-4 text-[9px] font-semibold text-zinc-600">
            <Link href={routes.safety}>Safety</Link>
            <Link href={routes.privacy}>Privacy</Link>
            <Link href={routes.terms}>Terms</Link>
          </div>
          <p className="mt-3 text-center text-[9px] leading-4 text-zinc-700">
            By continuing, you agree to use Extrovert respectfully and follow the community rules.
          </p>
        </footer>
      </div>
    </main>
  );
}

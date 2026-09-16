import Link from "next/link";
import { Heart, ShieldCheck } from "lucide-react";
import { LoginGoogle } from "@/components/login-google";
import { routes } from "@/config/routes";

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] bg-white px-4 py-6 font-sans text-zinc-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href={routes.home} className="mb-8 flex items-center gap-2 text-xs font-black text-emerald-700">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white"><Heart className="h-4 w-4 fill-current" /></span>
          Extrovert
        </Link>
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">NEW ACCOUNT</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Start with Google.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">One secure Google account is all you need. After signing in, you’ll finish your Extrovert profile.</p>
        <div className="mt-7 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
          <LoginGoogle label="Create account with Google" />
          <div className="mt-4 rounded-2xl bg-emerald-50/70 p-3 text-[10px] leading-4 text-emerald-900/70"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />Google securely verifies your account. Extrovert never receives or stores your Google password.</div>
          <p className="mt-4 text-center text-[10px] leading-4 text-zinc-400">By continuing, you agree to the <Link href={routes.terms} className="font-bold text-emerald-700">Terms</Link> and <Link href={routes.privacy} className="font-bold text-emerald-700">Privacy Policy</Link>.</p>
        </div>
        <p className="mt-5 text-center text-xs text-zinc-500">Already have an account? <Link href={routes.login} className="font-black text-emerald-700">Sign in with Google</Link></p>
      </div>
    </main>
  );
}

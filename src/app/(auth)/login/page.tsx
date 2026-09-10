import Link from "next/link";
import { Heart, MapPin, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { LoginGoogle } from "@/components/login-google";
import { LoginEmail } from "@/components/login-email";

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] bg-white px-4 py-6 font-sans text-zinc-950 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section className="hidden rounded-[2.5rem] border border-emerald-100 bg-emerald-50/60 p-8 shadow-sm lg:block">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md"><Heart className="h-6 w-6 fill-current" /></div><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">EXTROVERT</p><p className="text-xs font-bold text-emerald-900/60">Dating + Social</p></div></div>
          <h1 className="mt-10 max-w-lg text-5xl font-black leading-[.98] tracking-[-.06em]">Meet people. Make connections. Stay in control.</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-emerald-950/65">One account for Discover dating and Explore social. Your exact location stays private, and trust features are designed around the information people actually need.</p>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-3"><div className="rounded-2xl border border-white bg-white/80 p-4"><Users className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs font-black">Dating + friends</p><p className="mt-1 text-[10px] leading-4 text-zinc-500">Switch between the two without duplicate accounts.</p></div><div className="rounded-2xl border border-white bg-white/80 p-4"><MapPin className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs font-black">Area-level privacy</p><p className="mt-1 text-[10px] leading-4 text-zinc-500">Discover uses approximate locality, not exact coordinates.</p></div><div className="rounded-2xl border border-white bg-white/80 p-4"><ShieldCheck className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs font-black">Trust controls</p><p className="mt-1 text-[10px] leading-4 text-zinc-500">Verification, reporting and blocking are built in.</p></div></div>
        </section>
        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 lg:hidden"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md"><Heart className="h-6 w-6 fill-current" /></div></div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">WELCOME TO EXTROVERT</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.055em]">Your people are out there.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Sign in with Google or email, then build your profile at your own pace.</p>
          <div className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm">
            <LoginGoogle />
            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" /><span>or</span><span className="h-px flex-1 bg-zinc-200" /></div>
            <LoginEmail />
            <div className="mt-4 rounded-2xl bg-emerald-50/70 p-3 text-[10px] leading-4 text-emerald-900/70"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />Your account stays in one identity system. Email confirmation happens before profile setup.</div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-zinc-400"><Link href="/safety">Safety</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <p className="mt-4 text-center text-[9px] leading-4 text-zinc-400">By continuing, you agree to use Extrovert respectfully and follow the community rules.</p>
          <Link href="/about" className="mx-auto mt-5 flex w-fit items-center gap-1 text-[10px] font-black text-emerald-700">Learn about Extrovert <ArrowRight className="h-3 w-3" /></Link>
        </section>
      </div>
    </main>
  );
}

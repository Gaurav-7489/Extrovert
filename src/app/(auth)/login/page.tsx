"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Heart, MapPin, ShieldCheck, Users, ArrowRight, Globe2, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/config/routes";

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function googleSignIn() {
    setGoogleLoading(true);
    setGoogleError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(routes.app)}`, queryParams: { access_type: "offline", prompt: "select_account" } },
    });
    if (error) { setGoogleError("Google sign-in could not start. Please try again."); setGoogleLoading(false); }
  }

  async function emailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return setEmailError("Enter a valid email address.");
    if (password.length < 8) return setEmailError("Use a password with at least 8 characters.");
    setEmailLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setEmailLoading(false);
    if (error) return setEmailError(error.message.toLowerCase().includes("invalid login credentials") ? "Incorrect email or password." : error.message);
    if (!data.user) return setEmailError("We could not start your session. Please try again.");
    window.location.assign(routes.app);
  }

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
            <div className="mt-1">
              <button type="button" onClick={googleSignIn} disabled={googleLoading} className="flex h-13 w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 disabled:cursor-wait disabled:opacity-70"><span className="flex items-center gap-3"><Globe2 className="h-5 w-5" /><span>{googleLoading ? "Connecting to Google…" : "Continue with Google"}</span></span>{googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}</button>
              {googleError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold leading-4 text-red-700">{googleError}</p>}
            </div>
            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" /><span>or</span><span className="h-px flex-1 bg-zinc-200" /></div>
            <form onSubmit={emailSignIn} className="space-y-3">
              <label className="block text-xs font-bold text-zinc-700">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="you@example.com" /></label>
              <label className="block text-xs font-bold text-zinc-700">Password<div className="relative mt-1.5"><input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="Your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {emailError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-5 text-rose-700">{emailError}</p>}
              <button type="submit" disabled={emailLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-950 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{emailLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign in with email <ArrowRight className="h-4 w-4" /></>}</button>
            </form>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold"><Link href={routes.register} className="text-emerald-700">Create a new account</Link><Link href={routes.resetPassword} className="text-zinc-500">Forgot password?</Link></div>
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

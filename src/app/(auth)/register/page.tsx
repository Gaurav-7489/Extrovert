"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Heart, Loader2, ShieldCheck } from "lucide-react";
import { registerWithEmail } from "@/services/auth.service";
import { routes } from "@/config/routes";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirm) return setError("Those passwords do not match.");
    setLoading(true);
    const result = await registerWithEmail(email, password);
    setLoading(false);
    if (!result.success) return setError(result.error);
    if (result.needsEmailConfirmation) {
      setSent(true);
      return;
    }
    window.location.assign(routes.onboarding);
  }

  return (
    <main className="min-h-[100dvh] bg-white px-4 py-6 font-sans text-zinc-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href={routes.home} className="mb-8 flex items-center gap-2 text-xs font-black text-emerald-700">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white"><Heart className="h-4 w-4 fill-current" /></span>
          Extrovert
        </Link>

        <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">NEW ACCOUNT</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Start with your email.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Create your account, confirm your email, then finish the Extrovert identity setup.</p>

        {sent ? (
          <div className="mt-7 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            <h2 className="mt-4 text-lg font-black">Check your inbox</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-950/70">We created your account. Confirm the email address from the link we sent, and you’ll be returned to Extrovert to complete your profile.</p>
            <Link href={`${routes.verify}?email=${encodeURIComponent(email.trim().toLowerCase())}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white">Open verification help <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-bold text-zinc-700">Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="you@example.com" /></label>
            <label className="mt-4 block text-xs font-bold text-zinc-700">Password<div className="relative mt-1.5"><input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="At least 8 characters" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <label className="mt-4 block text-xs font-bold text-zinc-700">Confirm password<input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="Repeat your password" /></label>
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-5 text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white shadow-sm disabled:cursor-wait disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}</button>
            <p className="mt-4 text-center text-[10px] leading-4 text-zinc-400">By continuing, you agree to use Extrovert respectfully and follow the community rules.</p>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-zinc-500">Already have an account? <Link href={routes.login} className="font-black text-emerald-700">Sign in</Link></p>
      </div>
    </main>
  );
}

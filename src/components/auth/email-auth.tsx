"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmail } from "@/services/auth.service";
import { routes } from "@/config/routes";

export function EmailAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);
    if (!result.success) return setError(result.error);
    window.location.assign(routes.app);
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-bold text-zinc-700">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="you@example.com" /></label>
        <label className="block text-xs font-bold text-zinc-700">Password<div className="relative mt-1.5"><input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:bg-white" placeholder="Your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-5 text-rose-700">{error}</p>}
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-950 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign in with email <ArrowRight className="h-4 w-4" /></>}</button>
      </form>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold"><Link href={routes.register} className="text-emerald-700">Create a new account</Link><Link href={routes.resetPassword} className="text-zinc-500">Forgot password?</Link></div>
    </div>
  );
}

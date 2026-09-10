"use client";

import { useState } from "react";
import { ArrowRight, Globe2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginGoogle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/app")}`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (authError) {
      setError("Google sign-in could not start. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={signIn} disabled={loading} className="flex h-13 w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 text-sm font-black text-white shadow-lg shadow-zinc-950/10 disabled:cursor-wait disabled:opacity-70">
        <span className="flex items-center gap-3"><Globe2 className="h-5 w-5" /><span>{loading ? "Connecting to Google…" : "Continue with Google"}</span></span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </button>
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold leading-4 text-red-700">{error}</p>}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { routes } from "@/config/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DateBuExtrovertCheckout } from "@/components/payments/datebu-extrovert-checkout";

export const metadata: Metadata = { title: "Extrovert Premium" };
export const dynamic = "force-dynamic";

const features = [
  "More profile reach",
  "See who viewed you",
  "See who liked you",
  "Dating insights",
  "Ghost Mode",
  "Rewind",
  "Advanced discovery",
  "More daily likes",
];

export default async function PremiumPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: active } = user
    ? await supabase.rpc("is_datebu_pro")
    : { data: false };

  return (
    <main className="mx-auto w-full max-w-md px-3.5 pb-28 pt-4 font-sans text-zinc-50">
      <header className="flex items-center gap-3">
        <Link
          href={routes.discover}
          aria-label="Back to Discover"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-[#16161d] text-zinc-300 hover:bg-[#1d1d25]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-red-400">EXTROVERT PREMIUM</p>
          <h1 className="text-xl font-black tracking-tight">Premium</h1>
        </div>
        <Crown className="ml-auto h-6 w-6 text-red-400" />
      </header>

      <section className="mt-4 overflow-hidden rounded-[2rem] border border-[#550000]/40 bg-gradient-to-br from-[#1f090b] via-[#121216] to-[#0d0d10] p-5 shadow-2xl">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-red-300">
          <Sparkles className="h-3.5 w-3.5" />
          Extrovert Premium
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight">Get more from Extrovert.</h2>
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          More reach, more control, and more ways to connect.
        </p>

        {active ? (
          <div className="mt-5 rounded-2xl border border-[#550000]/40 bg-[#550000]/20 p-4">
            <p className="text-sm font-black text-red-300">Premium is active</p>
            <p className="mt-1 text-[11px] text-zinc-400">Your Premium access is active.</p>
          </div>
        ) : (
          <div className="mt-5">
            <DateBuExtrovertCheckout />
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[2rem] border border-white/10 bg-[#121216] p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-black">Included</h2>
        </div>
        <div className="mt-4 space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#16161d] px-3 py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[#550000]/20 text-red-300">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-zinc-200">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
        Safety and verification stay the same for everyone.
      </div>
    </main>
  );
}

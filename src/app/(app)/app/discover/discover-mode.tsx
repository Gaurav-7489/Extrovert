"use client";

import { useState } from "react";
import Link from "next/link";
import { Crosshair, MapPin, Sparkles } from "lucide-react";
import DiscoverClient, { type DiscoverProfile } from "./discover-smooth";
import { routes } from "@/config/routes";

type Props = {
  profiles: DiscoverProfile[];
  nearbyProfiles: DiscoverProfile[];
  isPro?: boolean;
  nearbyArea?: string | null;
  areaVerified?: boolean;
};

export default function DiscoverMode({
  profiles,
  nearbyProfiles,
  isPro = false,
  nearbyArea = null,
  areaVerified = false,
}: Props) {
  const [mode, setMode] = useState<"for-you" | "nearby">("for-you");
  const visible = mode === "nearby" ? nearbyProfiles : profiles;

  return (
    <div className="extrovert-discover mx-auto flex w-full max-w-[34rem] flex-col px-3 pt-3 font-sans sm:px-4">
      <div
        className="mb-3 grid grid-cols-2 rounded-2xl border border-white/[.08] bg-[#111116] p-1 shadow-sm"
        role="tablist"
        aria-label="Discover mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "for-you"}
          onClick={() => setMode("for-you")}
          className={`pressable flex items-center justify-center rounded-xl py-2 text-xs font-bold ${
            mode === "for-you"
              ? "bg-white/[.08] text-white shadow-sm"
              : "text-zinc-500"
          }`}
        >
          For You
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "nearby"}
          onClick={() => setMode("nearby")}
          className={`pressable flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
            mode === "nearby"
              ? "border border-[rgb(var(--brand-red)/.28)] bg-[rgb(var(--brand-red)/.11)] text-[rgb(var(--brand-red))]"
              : "text-zinc-500"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Nearby</span>
        </button>
      </div>

      {mode === "nearby" && areaVerified && nearbyArea && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[.07] px-3.5 py-2 text-[11px] font-semibold text-emerald-200">
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">Verified locality · {nearbyArea}</span>
          <span className="ml-auto rounded-full border border-white/[.08] bg-black/25 px-2 py-0.5 text-[10px] font-bold text-zinc-200">
            {nearbyProfiles.length}
          </span>
        </div>
      )}

      {mode === "nearby" && !areaVerified ? (
        <main className="flex min-h-[calc(100svh-210px)] items-center justify-center px-2 py-6 supports-[height:100dvh]:min-h-[calc(100dvh-210px)]">
          <section className="w-full rounded-[2rem] border border-white/[.08] bg-[#111116] p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Crosshair className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
              PRECISE AREA REQUIRED
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
              Verify your current locality
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Nearby only uses your verified locality. We do not expose exact coordinates to other people.
            </p>
            <Link
              href={routes.identityVerification}
              className="neon-cta mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black text-white"
            >
              <MapPin className="h-4 w-4" />
              Verify location
            </Link>
          </section>
        </main>
      ) : mode === "nearby" && nearbyProfiles.length === 0 ? (
        <main className="flex min-h-[calc(100svh-210px)] items-center justify-center px-2 py-6 supports-[height:100dvh]:min-h-[calc(100dvh-210px)]">
          <section className="w-full rounded-[2rem] border border-white/[.08] bg-[#111116] p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[rgb(var(--brand-red)/.2)] bg-[rgb(var(--brand-red)/.08)] text-[rgb(var(--brand-red))]">
              <MapPin className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--brand-red))]">
              NEARBY · {nearbyArea ?? "YOUR AREA"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
              No eligible profiles here yet
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Nearby is working from your verified locality and your dating preferences. For You can include people outside this local circle.
            </p>
            <button
              type="button"
              onClick={() => setMode("for-you")}
              className="neon-cta mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black text-white"
            >
              <Sparkles className="h-4 w-4" />
              Explore For You
            </button>
          </section>
        </main>
      ) : (
        <DiscoverClient key={mode} profiles={visible} isPro={isPro} />
      )}
    </div>
  );
}

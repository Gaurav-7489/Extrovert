"use client";

import { useState } from "react";
import Link from "next/link";
import { Crosshair, MapPin, Sparkles } from "lucide-react";
import { routes } from "@/config/routes";
import DiscoverClient, { type DiscoverProfile } from "./discover-smooth";

type Props = {
  profiles: DiscoverProfile[];
  nearbyProfiles: DiscoverProfile[];
  isPro?: boolean;
  nearbyArea?: string | null;
  nearbyVerified?: boolean;
  nearbyUnavailable?: boolean;
};

export default function DiscoverMode({
  profiles,
  nearbyProfiles,
  isPro = false,
  nearbyArea = null,
  nearbyVerified = false,
  nearbyUnavailable = false,
}: Props) {
  const [mode, setMode] = useState<"for-you" | "nearby">("for-you");
  const visible = mode === "nearby" ? nearbyProfiles : profiles;

  return (
    <div className="extrovert-discover mx-auto flex w-full flex-col px-3 pt-3 font-sans sm:px-4">
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
          className={
            "flex items-center justify-center rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-[.98] " +
            (mode === "for-you"
              ? "bg-white/[.08] text-white shadow-sm"
              : "text-zinc-500")
          }
        >
          For You
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "nearby"}
          onClick={() => setMode("nearby")}
          className={
            "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-[.98] " +
            (mode === "nearby"
              ? "border border-[rgb(var(--brand-red)/.22)] bg-[rgb(var(--brand-red)/.1)] text-[rgb(var(--brand-red))]"
              : "text-zinc-500")
          }
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Nearby</span>
        </button>
      </div>

      {mode === "nearby" && nearbyVerified && nearbyProfiles.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[rgb(var(--brand-red)/.14)] bg-[rgb(var(--brand-red)/.06)] px-3.5 py-2 text-[11px] font-semibold text-zinc-300">
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--brand-red))]" />
          <span className="truncate">
            {nearbyArea ? "Near " + nearbyArea : "Near your verified location"} · within 25 km
          </span>
          <span className="ml-auto rounded-full border border-white/[.08] bg-white/[.04] px-2 py-0.5 text-[10px] font-bold text-zinc-200">
            {nearbyProfiles.length}
          </span>
        </div>
      )}

      {mode === "nearby" && (!nearbyVerified || nearbyProfiles.length === 0) ? (
        <main className="flex min-h-[calc(var(--app-height,100dvh)-210px)] items-center justify-center px-2 py-5">
          <section className="w-full rounded-[2rem] border border-white/[.08] bg-[#111116] p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[rgb(var(--brand-red)/.2)] bg-[rgb(var(--brand-red)/.08)] text-[rgb(var(--brand-red))]">
              <MapPin className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--brand-red))]">
              NEARBY
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-50">
              {!nearbyVerified
                ? "Verify your precise area first"
                : nearbyUnavailable
                ? "Nearby is reconnecting"
                : "No nearby profiles right now"}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400">
              {!nearbyVerified
                ? "Nearby uses a private rounded location fix so it can sort people by real distance instead of a city-name guess."
                : nearbyUnavailable
                ? "For You still works. Nearby will return when the location service reconnects."
                : "We checked up to 25 km from your verified location. Switch to For You or check back as more people join."}
            </p>

            {!nearbyVerified ? (
              <Link
                href={routes.identityVerification}
                className="neon-cta mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-xs font-black text-white"
              >
                <Crosshair className="h-4 w-4" />
                Verify precise area
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setMode("for-you")}
                className="neon-cta mt-6 inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-xs font-black text-white"
              >
                <Sparkles className="h-4 w-4" />
                Explore For You
              </button>
            )}
          </section>
        </main>
      ) : (
        <DiscoverClient key={mode} profiles={visible} isPro={isPro} />
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import DiscoverClient, { type DiscoverProfile } from "./discover-smooth";

type Props = { profiles: DiscoverProfile[]; isPro?: boolean; nearbyArea?: string | null };

export default function DiscoverMode({ profiles, isPro = false, nearbyArea = null }: Props) {
  const [mode, setMode] = useState<"for-you" | "nearby">("for-you");

  const nearbyProfiles = useMemo(() => {
    const area = nearbyArea?.trim().toLowerCase();
    if (!area) return [];
    return profiles.filter((profile) => profile.area_name?.trim().toLowerCase() === area);
  }, [profiles, nearbyArea]);

  const visibleProfiles = mode === "nearby" ? nearbyProfiles : profiles;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-2.5 pt-2 sm:px-4">
      <div className="mb-2 grid grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 shadow-sm" role="tablist" aria-label="Discover mode">
        <button type="button" role="tab" aria-selected={mode === "for-you"} onClick={() => setMode("for-you")} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${mode === "for-you" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}>
          For You
        </button>
        <button type="button" role="tab" aria-selected={mode === "nearby"} onClick={() => setMode("nearby")} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition ${mode === "nearby" ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-500"}`}>
          <MapPin className="h-3.5 w-3.5" /> Nearby
        </button>
      </div>

      {mode === "nearby" && nearbyArea && nearbyProfiles.length > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[10px] font-bold text-emerald-800">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          People in {nearbyArea}
          <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[9px] font-black">{nearbyProfiles.length}</span>
        </div>
      )}

      {mode === "nearby" && nearbyProfiles.length === 0 ? (
        <main className="flex min-h-[calc(100dvh-190px)] items-center justify-center px-2 py-6">
          <section className="w-full rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-7 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm"><MapPin className="h-7 w-7" /></div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">NEARBY</p>
            <h1 className="mt-1 text-2xl font-black">No one nearby yet.</h1>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Try For You to discover more people. Nearby only shows members whose verified area matches yours.</p>
            <button type="button" onClick={() => setMode("for-you")} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-sm"><Sparkles className="h-4 w-4" /> Explore For You</button>
          </section>
        </main>
      ) : (
        <DiscoverClient key={mode} profiles={visibleProfiles} isPro={isPro} />
      )}
    </div>
  );
}

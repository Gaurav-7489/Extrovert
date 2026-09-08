"use client";

import { useMemo, useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import DiscoverClient, { type DiscoverProfile } from "./discover-smooth";

type Props = {
  profiles: DiscoverProfile[];
  isPro?: boolean;
  nearbyArea?: string | null;
};

export default function DiscoverMode({ profiles, isPro = false, nearbyArea = null }: Props) {
  const [mode, setMode] = useState<"for-you" | "nearby">("for-you");
  const nearbyProfiles = useMemo(() => {
    const area = nearbyArea?.trim().toLowerCase();
    if (!area) return [];
    return profiles.filter((p) => p.area_verification_status === "verified" && p.area_name?.trim().toLowerCase() === area);
  }, [profiles, nearbyArea]);
  const visible = mode === "nearby" ? nearbyProfiles : profiles;

  return (
    <div className="extrovert-discover mx-auto flex w-full max-w-md flex-col px-3 pt-2 font-sans sm:px-4">
      <style jsx global>{`
        .extrovert-discover main { gap: 0 !important; }
        .extrovert-discover main > header { margin-bottom: 10px !important; }
        .extrovert-discover main > div.relative { flex: 0 0 480px !important; height: 480px !important; min-height: 480px !important; }
        .extrovert-discover main > div.relative > article { height: 480px !important; min-height: 480px !important; border-radius: 28px !important; border-color: #27272f !important; background: #121216 !important; box-shadow: 0 18px 50px rgba(0,0,0,.42) !important; }
        .extrovert-discover main > div.relative > article > div.absolute.inset-0:first-child { top: 12px !important; left: 12px !important; right: 12px !important; bottom: auto !important; width: auto !important; height: 300px !important; border-radius: 22px !important; overflow: hidden !important; }
        .extrovert-discover main > div.relative > article > div.absolute.inset-0:nth-child(2), .extrovert-discover main > div.relative > article > div.absolute.left-5, .extrovert-discover main > div.relative > article > div.absolute.right-5 { display: none !important; }
        .extrovert-discover main > div.relative > article > div.absolute.left-3\\.5 { top: 22px !important; left: 24px !important; right: 24px !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 { top: 328px !important; right: 24px !important; bottom: auto !important; left: 24px !important; padding: 0 !important; color: #f5f5f7 !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 > div:first-child span { border-color: #550000 !important; background: #550000 !important; color: #fff !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 h2 { margin-top: 12px !important; font-size: 25px !important; line-height: 1.15 !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 p { color: #a2a2ac !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 > div:last-child { margin-top: 12px !important; padding-top: 12px !important; border-top: 1px solid #27272f !important; }
        .extrovert-discover main > div.relative > article > div.absolute.bottom-0 > div:last-child span { background: transparent !important; border-color: #27272f !important; color: #a2a2ac !important; }
        .extrovert-discover main > div.mt-2\\.5 { margin-top: 12px !important; gap: 10px !important; }
        .extrovert-discover main > div.mt-2\\.5 button, .extrovert-discover main > div.mt-2\\.5 a { transform: translateZ(0); }
        @media (max-height: 760px) {
          .extrovert-discover main > div.relative { flex-basis: 430px !important; height: 430px !important; min-height: 430px !important; }
          .extrovert-discover main > div.relative > article { height: 430px !important; min-height: 430px !important; }
          .extrovert-discover main > div.relative > article > div.absolute.inset-0:first-child { height: 265px !important; }
          .extrovert-discover main > div.relative > article > div.absolute.bottom-0 { top: 288px !important; }
        }
      `}</style>

      <div className="mb-3 grid grid-cols-2 rounded-2xl border border-zinc-200/90 bg-zinc-100/90 p-1 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#141419]" role="tablist" aria-label="Discover mode">
        <button type="button" role="tab" aria-selected={mode === "for-you"} onClick={() => setMode("for-you")} className={`flex items-center justify-center rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${mode === "for-you" ? "bg-white text-zinc-950 shadow-sm dark:bg-[#202028] dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>For You</button>
        <button type="button" role="tab" aria-selected={mode === "nearby"} onClick={() => setMode("nearby")} className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${mode === "nearby" ? "border border-[#550000]/20 bg-white text-[#550000] shadow-sm dark:border-[#550000]/40 dark:bg-[#202028] dark:text-red-400" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}><MapPin className="h-3.5 w-3.5" /><span>Nearby</span></button>
      </div>

      {mode === "nearby" && nearbyArea && nearbyProfiles.length > 0 && <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[#550000]/15 bg-[#550000]/5 px-3.5 py-2 text-[11px] font-semibold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">People in {nearbyArea}</span><span className="ml-auto rounded-full border border-zinc-200/60 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800 shadow-2xs dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-200">{nearbyProfiles.length}</span></div>}

      {mode === "nearby" && nearbyProfiles.length === 0 ? (
        <main className="flex min-h-[calc(100dvh-200px)] items-center justify-center px-2 py-6">
          <section className="w-full rounded-[2rem] border border-zinc-200/90 bg-white p-7 text-center shadow-lg transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl sm:p-8">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300"><MapPin className="h-7 w-7" /></div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">Nearby Members</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">No one nearby yet</h1>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">Try switching to For You to discover people in neighboring circles. Nearby shows members in your verified zone without exposing exact locations.</p>
            <button type="button" onClick={() => setMode("for-you")} className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition-all duration-150 hover:bg-[#680202] active:scale-95"><Sparkles className="h-4 w-4" /><span>Explore For You</span></button>
          </section>
        </main>
      ) : <DiscoverClient key={mode} profiles={visible} isPro={isPro} />}
    </div>
  );
}

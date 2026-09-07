"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";

type MatchEvent = { matchId: string; displayName?: string | null };
type MatchRow = { id: string; user_a: string; user_b: string };
type MatchProfile = { display_name: string | null };

export function MatchCelebration() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const shown = useRef(new Set<string>());
  const [match, setMatch] = useState<MatchEvent | null>(null);

  useEffect(() => {
    const show = (event: MatchEvent) => {
      if (!event.matchId || shown.current.has(event.matchId)) return;
      shown.current.add(event.matchId);
      setMatch(event);
      router.refresh();
    };

    const onLocalMatch = (event: Event) => {
      const detail = (event as CustomEvent<MatchEvent>).detail;
      if (detail) show(detail);
    };

    window.addEventListener("extrovert:match", onLocalMatch);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;

      channel = supabase
        .channel(`match-celebration-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "matches" },
          async (payload) => {
            const row = payload.new as MatchRow;
            if (!row?.id || (row.user_a !== userId && row.user_b !== userId)) return;
            const otherId = row.user_a === userId ? row.user_b : row.user_a;
            const { data: profiles } = await supabase.rpc("get_match_profiles", {
              p_user_ids: [otherId],
            });
            const profile = (
              Array.isArray(profiles) ? profiles[0] : null
            ) as MatchProfile | null;
            show({
              matchId: row.id,
              displayName: profile?.display_name ?? "your new match",
            });
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("extrovert:match", onLocalMatch);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return (
    <AnimatePresence>
      {match && (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-white p-7 text-center shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <button
              type="button"
              onClick={() => setMatch(null)}
              aria-label="Close match celebration"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 dark:bg-[#1a1a22] dark:text-zinc-400 dark:hover:bg-[#242430] dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#550000]/20 bg-[#550000]/10 ring-8 ring-[#550000]/5 dark:border-[#550000]/40 dark:bg-[#550000]/25 dark:ring-[#550000]/15">
              <Heart className="h-11 w-11 fill-current text-[#550000] dark:text-red-400 animate-pulse" />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#550000] dark:text-red-400">
              It&apos;s a match!
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              You both liked each other
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
              You and{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {match.displayName ?? "someone"}
              </span>{" "}
              are now connected.
            </p>

            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => router.push(`${routes.messages}/${match.matchId}`)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition-all duration-150 hover:bg-[#680202] active:scale-95 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Start conversation</span>
              </button>

              <button
                type="button"
                onClick={() => setMatch(null)}
                className="h-10 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-900 active:scale-95 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Keep discovering
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";

type MatchEvent = {
  matchId: string;
  displayName?: string | null;
};

type MatchRow = { id: string; user_a: string; user_b: string };
type MatchProfile = { display_name: string | null };

export function MatchCelebration() {
  const router = useRouter();
  const supabase = createClient();
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
            const profile = (Array.isArray(profiles) ? profiles[0] : null) as MatchProfile | null;

            show({
              matchId: row.id,
              displayName: profile?.display_name ?? "your new match",
            });
          },
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
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-zinc-950/35 p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-7 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setMatch(null)}
              aria-label="Close match"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-500"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
              <Heart className="h-10 w-10 fill-current text-emerald-600" />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">It&apos;s a match</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">You both liked each other.</h2>
            <p className="mt-2 text-sm text-zinc-500">
              You matched with <span className="font-bold text-zinc-800">{match.displayName ?? "someone"}</span>.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => router.push(`${routes.messages}/${match.matchId}`)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg shadow-emerald-200"
              >
                <MessageCircle className="h-4 w-4" />
                Open chat
              </button>
              <button type="button" onClick={() => setMatch(null)} className="h-10 text-xs font-bold text-zinc-500">
                Keep discovering
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Lock, Sparkles, Send } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import LikesGrid from "./likes-grid";
import SentLikesGrid, { type SentLike } from "./sent-likes-grid";

type Liker = {
  liker_id: string;
  liked_at: string;
  display_name: string;
  date_of_birth: string;
  department: string | null;
  academic_year: string | null;
  identity_type: string | null;
  institution_name: string | null;
  job_title: string | null;
  profile_photos: {
    storage_path: string;
    is_primary: boolean;
    display_order: number;
  }[];
};

type MatchRow = { user_id: string; match_id: string };

type CountDb = {
  from: (table: "likes") => {
    select: (
      columns: string,
      options?: { count?: "exact"; head?: boolean }
    ) => {
      eq: (column: string, value: string) => Promise<{ count: number | null }>;
    };
  };
};

export const metadata: Metadata = { title: "Likes | DateBu" };
export const dynamic = "force-dynamic";

export default async function LikesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect(routes.login);

  const [{ data: identity }, { data: subscription }, { count }, { data: sent }] =
    await Promise.all([
      supabase
        .from("extrovert_profiles")
        .select("gender")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan,status,current_period_end,trial_ends_at")
        .eq("user_id", userId)
        .maybeSingle(),
      (supabase as unknown as CountDb)
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("liked_id", userId),
      supabase.rpc("get_people_i_liked", { p_limit: 100 }),
    ]);

  const now = Date.now();
  const paid =
    subscription?.plan === "pro" &&
    ((subscription.status === "active" &&
      !!subscription.current_period_end &&
      new Date(subscription.current_period_end).getTime() > now) ||
      (subscription.status === "trialing" &&
        !!subscription.trial_ends_at &&
        new Date(subscription.trial_ends_at).getTime() > now));

  const woman = ["woman", "female"].includes(
    (identity?.gender ?? "").toLowerCase()
  );
  const allowed = woman || paid;
  const total = count ?? 0;
  const sentLikes = (sent ?? []) as SentLike[];

  if (!allowed) {
    return (
      <main className="mx-auto max-w-md px-3.5 pb-24 pt-3 font-sans text-zinc-950 dark:text-zinc-100 sm:px-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
            LIKES
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
            Your Likes
          </h1>
        </div>

        <section className="mt-4 rounded-[2rem] border border-zinc-200/90 bg-white p-6 text-center shadow-lg transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl sm:p-7">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            <Heart className="h-7 w-7 fill-current" />
          </div>

          <p className="mt-3 text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
            {total}
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            people have liked your profile
          </p>

          <div className="mx-auto mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-white/5 dark:bg-[#181820]">
            <div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#550000]/10 text-[#550000] dark:bg-[#550000]/25 dark:text-red-300">
              <Lock className="h-4 w-4" />
            </div>
            <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              See who they are
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Reveal people who liked you and match instantly with DateBu Plus.
            </p>
          </div>

          <Link
            href={routes.extrovert}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition-all duration-150 hover:bg-[#680202] active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Unlock Incoming Likes</span>
          </Link>
        </section>

        <section className="mt-7">
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
            <Send className="h-3.5 w-3.5" />
            <span>Likes you sent</span>
          </div>
          <SentLikesGrid likes={sentLikes} />
        </section>
      </main>
    );
  }

  const { data: incoming, error } = await supabase.rpc(
    "get_people_who_liked_me",
    { p_limit: 100 }
  );
  if (error) console.error("Failed to load incoming Likes:", error);

  const likers = (incoming ?? []) as Liker[];
  const { data: matches } = likers.length
    ? await supabase.rpc("get_like_match_ids", {
        p_user_ids: likers.map((l) => l.liker_id),
      })
    : { data: [] as MatchRow[] };

  const matchMap = new Map<string, string>(
    ((matches ?? []) as MatchRow[]).map((m) => [m.user_id, m.match_id])
  );

  const enriched = likers.map((l) => ({
    ...l,
    match_id: matchMap.get(l.liker_id) ?? null,
  }));

  const matchCount = enriched.filter((x) => x.match_id).length;

  return (
    <main className="mx-auto max-w-md px-3.5 pb-24 pt-3 font-sans text-zinc-950 dark:text-zinc-100 sm:px-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
            LIKES
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
            Likes
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            People who liked you, plus the Likes you sent.
          </p>
        </div>
        {matchCount > 0 && (
          <span className="shrink-0 rounded-full border border-[#550000]/20 bg-[#550000]/10 px-2.5 py-1 text-[10px] font-bold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            {matchCount} matched
          </span>
        )}
      </div>

      <section className="mt-5">
        <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
          <Heart className="h-3.5 w-3.5" />
          <span>Incoming Likes ({enriched.length})</span>
        </div>
        <LikesGrid likers={enriched} />
      </section>

      <section className="mt-7">
        <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
          <Send className="h-3.5 w-3.5" />
          <span>Likes you sent ({sentLikes.length})</span>
        </div>
        <SentLikesGrid likes={sentLikes} />
      </section>
    </main>
  );
}
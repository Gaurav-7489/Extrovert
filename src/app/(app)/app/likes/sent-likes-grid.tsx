"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, HeartOff, Loader2, ShieldCheck } from "lucide-react";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";
import { unlikeProfile } from "./actions";

export type SentLike = {
  liked_id: string;
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
  match_id: string | null;
};

export default function SentLikesGrid({ likes }: { likes: SentLike[] }) {
  const [items, setItems] = useState(likes);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    setBusy(id);
    const r = await unlikeProfile(id);
    if (!r.error) setItems((v) => v.filter((x) => x.liked_id !== id));
    setBusy(null);
  }

  if (!items.length) {
    return (
      <div className="mt-4 rounded-[2rem] border border-dashed border-zinc-200/90 bg-white p-8 text-center shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
          <Heart className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-zinc-950 dark:text-zinc-100">
          No active Likes
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Like someone from Discover and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {items.map((item) => {
        const photo = [...(item.profile_photos ?? [])].sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            a.display_order - b.display_order
        )[0];
        const url = getProfilePhotoUrl(photo?.storage_path, 240);
        const age = calculateAge(item.date_of_birth);
        const context =
          item.job_title ||
          item.department ||
          item.identity_type ||
          item.institution_name ||
          "DateBu member";
        const isBusy = busy === item.liked_id;

        return (
          <article
            key={item.liked_id}
            className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#121216] dark:shadow-black/40"
          >
            <Link
              href={`${routes.profileView}/${item.liked_id}`}
              className="block flex-1"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-100 dark:bg-[#181820]">
                {url ? (
                  <Image
                    src={url}
                    alt={item.display_name}
                    fill
                    sizes="(max-width:640px) 45vw, 220px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-3xl font-bold text-zinc-300 dark:text-zinc-700">
                    {item.display_name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 pt-10 text-white">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-bold text-white">
                      {item.display_name}
                      {age !== null ? `, ${age}` : ""}
                    </p>
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#550000] drop-shadow dark:text-red-400" />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-white/80 font-medium">
                    {context}
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-between gap-1.5 p-2.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                  item.match_id
                    ? "border border-[#550000]/25 bg-[#550000]/10 text-[#550000] dark:border-[#550000]/40 dark:bg-[#550000]/20 dark:text-red-300"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                }`}
              >
                {item.match_id ? "Matched" : "Liked"}
              </span>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => void remove(item.liked_id)}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50/80 px-2 py-1 text-[9px] font-bold text-rose-700 shadow-2xs transition-all hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300 dark:hover:bg-rose-900/40"
                aria-label={`Remove Like for ${item.display_name}`}
              >
                {isBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <HeartOff className="h-3 w-3" />
                )}
                <span>Unlike</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
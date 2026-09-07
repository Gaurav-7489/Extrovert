"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ellipsis, Heart, ShieldCheck, UserMinus, X, Loader2 } from "lucide-react";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";
import { removeMatch } from "./actions";

type Liker = {
  liker_id: string;
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
  match_id?: string | null;
};

export default function LikesGrid({ likers }: { likers: Liker[] }) {
  const [items, setItems] = useState(likers);
  const [menu, setMenu] = useState<Liker | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unmatch(target: Liker) {
    setMenu(null);
    setBusyId(target.liker_id);
    const r = await removeMatch(target.liker_id);
    setBusyId(null);
    if (!r.error) setItems((v) => v.filter((x) => x.liker_id !== target.liker_id));
  }

  if (!items.length) {
    return (
      <div className="mt-5 rounded-[2rem] border border-dashed border-zinc-200/90 bg-white p-8 text-center transition-colors dark:border-white/10 dark:bg-[#121216]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <p className="mt-3 text-sm font-bold text-zinc-950 dark:text-zinc-100">
          No likes yet
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Keep swiping. New likes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {items.map((liker) => {
        const photo = [...(liker.profile_photos ?? [])].sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            a.display_order - b.display_order
        )[0];
        const photoUrl = getProfilePhotoUrl(photo?.storage_path, 240);
        const age = calculateAge(liker.date_of_birth);
        const context =
          liker.job_title ||
          liker.department ||
          liker.identity_type ||
          liker.institution_name ||
          "DateBu member";
        const isBusy = busyId === liker.liker_id;

        return (
          <article
            key={liker.liker_id}
            className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#121216] dark:shadow-black/40"
          >
            <Link
              href={`${routes.profileView}/${liker.liker_id}`}
              className="block flex-1"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-100 dark:bg-[#181820]">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={liker.display_name}
                    fill
                    sizes="(max-width:640px) 45vw, 220px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-3xl font-bold text-zinc-300 dark:text-zinc-700">
                    {liker.display_name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 pt-10 text-white">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-bold text-white">
                      {liker.display_name}
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

            <div className="flex items-center justify-between p-2.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                  liker.match_id
                    ? "border border-[#550000]/25 bg-[#550000]/10 text-[#550000] dark:border-[#550000]/40 dark:bg-[#550000]/20 dark:text-red-300"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                }`}
              >
                {liker.match_id ? "Matched" : "Liked you"}
              </span>

              {liker.match_id && (
                <button
                  type="button"
                  onClick={() => setMenu(liker)}
                  disabled={isBusy}
                  className="grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 shadow-2xs transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                  aria-label={`Options for ${liker.display_name}`}
                >
                  {isBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Ellipsis className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </article>
        );
      })}

      {menu && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setMenu(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[1.75rem] border border-zinc-200/90 bg-white p-5 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#141419]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
                  Match options
                </p>
                <h3 className="mt-0.5 text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {menu.display_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMenu(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Remove this match if you no longer want to stay connected. They will
              disappear from your likes and messages.
            </p>

            <button
              type="button"
              onClick={() => void unmatch(menu)}
              disabled={busyId === menu.liker_id}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-sm shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-60 dark:bg-rose-700 dark:hover:bg-rose-600"
            >
              {busyId === menu.liker_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
              <span>Remove match</span>
            </button>

            <button
              type="button"
              onClick={() => setMenu(null)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Heart,
  X,
  ShieldCheck,
  Star,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  likeProfile,
  passProfile,
  rewindLastPass,
  resetPassedProfiles,
  blockUser,
  reportUser,
  superLikeProfile,
} from "./actions";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { calculateAge } from "@/lib/utils";

const SuperChatComposer = dynamic(
  () => import("@/components/payments/superchat-composer"),
  { ssr: false }
);

export type DiscoverProfile = {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  department: string | null;
  academic_year: string | null;
  bio: string | null;
  profile_photos:
    | {
        storage_path: string;
        display_order: number;
        is_primary: boolean;
        url?: string | null;
      }[]
    | null;
  profile_photo_url: string | null;
  verification_status?: string | null;
  area_verification_status?: string | null;
  area_name?: string | null;
  identity_context?: string | null;
  profile_interests?:
    | { interests: { name: string } | { name: string }[] | null }[]
    | null;
};

type Props = { profiles: DiscoverProfile[]; isPro?: boolean };
type ActionKind = "like" | "pass" | "super";

export default function DiscoverClient({ profiles, isPro = false }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState(profiles);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<DiscoverProfile | null>(null);
  const [reporting, setReporting] = useState<DiscoverProfile | null>(null);
  const [reason, setReason] = useState("Inappropriate photo or content");
  const [details, setDetails] = useState("");
  const [superChat, setSuperChat] = useState<DiscoverProfile | null>(null);
  const [leaving, setLeaving] = useState<{
    id: string;
    direction: "left" | "right";
  } | null>(null);

  useEffect(() => {
    setDeck(profiles);
    setBusy(false);
    if (profiles.length > 0) setReviewing(false);
  }, [profiles]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function act(id: string, kind: ActionKind) {
    if (busy || reviewing) return;
    const profile = deck.find((item) => item.id === id);
    if (!profile) return;
    setBusy(true);
    if (kind !== "super")
      setLeaving({ id, direction: kind === "like" ? "right" : "left" });
    setDeck((items) => items.filter((item) => item.id !== id));
    try {
      const result =
        kind === "like"
          ? await likeProfile(id)
          : kind === "pass"
          ? await passProfile(id)
          : await superLikeProfile(id);
      if (result.error) {
        setDeck((items) => [profile, ...items]);
        setLeaving(null);
        notify(result.error);
      } else if (
        kind === "like" &&
        "matched" in result &&
        result.matched &&
        result.matchId
      ) {
        window.dispatchEvent(
          new CustomEvent("extrovert:match", {
            detail: {
              matchId: result.matchId,
              displayName: profile.display_name,
            },
          })
        );
      } else if (kind === "super") {
        notify(`Super Like sent to ${profile.display_name ?? "this person"}.`);
      }
    } catch {
      setDeck((items) => [profile, ...items]);
      setLeaving(null);
      notify("Something went wrong. Try again");
    } finally {
      setBusy(false);
      window.setTimeout(() => setLeaving(null), 260);
    }
  }

  async function rewind() {
    if (!isPro || busy || reviewing) return;
    setBusy(true);
    const result = await rewindLastPass();
    if (result.error) {
      setBusy(false);
      notify(result.error);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  async function review() {
    if (busy || reviewing) return;
    setReviewing(true);
    const result = await resetPassedProfiles();
    if (result.error) {
      setReviewing(false);
      notify(result.error);
      return;
    }
    if (!result.count) {
      setReviewing(false);
      notify("No passed profiles to review yet.");
      return;
    }
    router.refresh();
  }

  async function block() {
    if (!menu) return;
    const id = menu.id;
    setMenu(null);
    const result = await blockUser(id);
    if (result.error) {
      notify(result.error);
      return;
    }
    setDeck((items) => items.filter((profile) => profile.id !== id));
    notify("Profile blocked and removed.");
  }

  async function report(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reporting) return;
    setBusy(true);
    const result = await reportUser(reporting.id, reason, details);
    setBusy(false);
    if (result.error) {
      notify(result.error);
      return;
    }
    setDeck((items) => items.filter((profile) => profile.id !== reporting.id));
    setReporting(null);
    setDetails("");
    notify("Report sent. Profile removed.");
  }

  const current = deck[0];

  if (!current) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-130px)] w-full max-w-md items-center justify-center px-4 py-6 font-sans">
        <section className="w-full rounded-[2rem] border border-zinc-200/90 bg-white p-7 text-center shadow-lg transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            {reviewing ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <Sparkles className="h-7 w-7" />
            )}
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
            DISCOVER
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {reviewing ? "Bringing profiles back…" : "You're all caught up."}
          </h1>
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400 sm:text-sm">
            {reviewing
              ? "Refreshing your Discover deck — you can keep this screen open."
              : "New profiles will appear as people join nearby."}
          </p>
          {reviewing ? (
            <div className="mx-auto mt-6 h-11 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ) : (
            <Button
              onClick={() => void review()}
              disabled={busy}
              className="mt-6 w-full rounded-2xl border border-[#550000]/30 bg-[#550000] text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95"
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Review passed profiles
            </Button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-130px)] min-h-0 w-full max-w-md flex-col overflow-hidden px-2 pb-2 pt-1 font-sans">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="fixed left-1/2 top-14 z-[120] -translate-x-1/2 rounded-full border border-[#550000]/20 bg-white/95 px-4 py-2 text-xs font-semibold text-zinc-900 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#15151c]/95 dark:text-zinc-100"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-2 flex shrink-0 items-center justify-between px-1.5 pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
            DISCOVER
          </p>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-xl">
            Find someone worth a hello
          </h1>
        </div>
        <Link
          href={routes.profileSetup}
          prefetch={false}
          aria-label="Discover preferences"
          className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs transition hover:border-[#550000]/30 hover:text-[#550000] active:scale-95 dark:border-white/10 dark:bg-[#15151c] dark:text-zinc-300 dark:hover:border-[#550000]/50 dark:hover:text-red-400"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
      </header>

      {/* Swipe Deck Viewport */}
      <div className="relative min-h-0 w-full flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          {deck.slice(0, 2).map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              top={index === 0}
              exitDirection={
                leaving?.id === profile.id ? leaving.direction : "left"
              }
              onSwipe={(direction) =>
                void act(profile.id, direction === "right" ? "like" : "pass")
              }
              onMenu={() => setMenu(profile)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Primary Floating Action Console */}
      <div className="mt-2.5 flex shrink-0 items-center justify-center gap-2 px-1">
        <button
          onClick={() => void rewind()}
          disabled={!isPro || busy || reviewing}
          aria-label="Rewind"
          title={isPro ? "Rewind last pass" : "DateBu Pro required"}
          className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 shadow-2xs transition hover:border-zinc-300 hover:text-zinc-800 active:scale-95 disabled:pointer-events-none disabled:opacity-35 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={() => void act(current.id, "pass")}
          disabled={busy || reviewing}
          aria-label="Pass"
          className="grid h-12 w-12 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:bg-white/5"
        >
          <X className="h-5 w-5 stroke-[2.2]" />
        </button>

        <button
          onClick={() => void act(current.id, "like")}
          disabled={busy || reviewing}
          aria-label="Like"
          className="grid h-14 w-14 place-items-center rounded-full border border-[#550000]/40 bg-[#550000] text-white shadow-lg shadow-[#550000]/30 transition hover:bg-[#680202] active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-[#550000]/60 dark:bg-[#550000] dark:shadow-black/60 dark:hover:bg-[#6e0303]"
        >
          <Heart className="h-7 w-7 fill-current" />
        </button>

        <button
          onClick={() => void act(current.id, "super")}
          disabled={busy || reviewing}
          aria-label="Super Like"
          className="grid h-12 w-12 place-items-center rounded-full border border-amber-300/80 bg-white text-amber-500 shadow-sm transition hover:bg-amber-50/50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-amber-500/30 dark:bg-[#16161d] dark:text-amber-400 dark:hover:bg-amber-500/10"
        >
          <Star className="h-5 w-5 fill-current" />
        </button>

        <button
          onClick={() => setSuperChat(current)}
          disabled={busy || reviewing}
          aria-label="Super Chat"
          className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:text-zinc-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <MessageCircle className="h-5 w-5" />
        </button>

        <Link
          href={`${routes.profileView}/${current.id}`}
          prefetch={false}
          aria-label="View profile details"
          className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-600 shadow-2xs transition hover:border-zinc-300 hover:text-zinc-900 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <UserRound className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-1 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
        Swipe right to Like · left to Pass
      </p>

      {/* Profile Context Drawer Modal */}
      <AnimatePresence>
        {menu && (
          <div
            className="fixed inset-0 z-[1000] grid place-items-end p-3 sm:place-items-center bg-black/60 backdrop-blur-xs"
            onClick={() => setMenu(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#141419]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
                <b className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Profile options
                </b>
                <button
                  onClick={() => setMenu(null)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3.5 grid gap-2">
                <Link
                  href={`${routes.profileView}/${menu.id}`}
                  prefetch={false}
                  onClick={() => setMenu(null)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 text-center text-xs font-bold text-zinc-800 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  View full profile
                </Link>
                <button
                  onClick={() => {
                    setReporting(menu);
                    setMenu(null);
                  }}
                  className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-left text-xs font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.98] dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300"
                >
                  Report profile
                </button>
                <button
                  onClick={() => void block()}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 text-left text-xs font-bold text-rose-800 transition hover:bg-rose-100 active:scale-[0.98] dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
                >
                  Block profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safety Report Dialog */}
      <AnimatePresence>
        {reporting && (
          <div className="fixed inset-0 z-[1001] grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.form
              onSubmit={report}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#141419]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
                <b className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Report profile
                </b>
                <button
                  type="button"
                  onClick={() => setReporting(null)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-3 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Reason
              </label>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-3 text-xs font-medium text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100 dark:focus:border-[#550000]"
              >
                <option>Inappropriate photo or content</option>
                <option>Harassment or abusive behavior</option>
                <option>Fake or impersonated profile</option>
                <option>Spam or commercial advertising</option>
                <option>Underage user</option>
                <option>Other safety concern</option>
              </select>

              <label className="mt-3 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What happened?"
                className="mt-1 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100 dark:focus:border-[#550000]"
              />

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReporting(null)}
                  className="flex-1 rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-2xl border border-[#550000]/30 bg-[#550000] text-white hover:bg-[#680202]"
                  leftIcon={
                    busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : undefined
                  }
                >
                  {busy ? "Sending…" : "Send report"}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {superChat && (
        <SuperChatComposer
          targetUserId={superChat.id}
          targetName={superChat.display_name ?? "Member"}
          onClose={() => setSuperChat(null)}
        />
      )}
    </main>
  );
}

function SwipeCard({
  profile,
  top,
  onSwipe,
  onMenu,
  exitDirection,
}: {
  profile: DiscoverProfile;
  top: boolean;
  onSwipe: (direction: "left" | "right") => void;
  onMenu: () => void;
  exitDirection: "left" | "right";
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [15, 60], [0, 1]);
  const passOpacity = useTransform(x, [-60, -15], [1, 0]);
  const age = profile.date_of_birth
    ? calculateAge(profile.date_of_birth)
    : null;
  const photo =
    profile.profile_photos?.find((item) => item.is_primary)?.url ??
    profile.profile_photo_url;
  const verified = profile.verification_status === "verified";
  const area = profile.area_verification_status === "verified";
  const names = (profile.profile_interests ?? []).flatMap((item) => {
    const interests = item.interests;
    if (!interests) return [];
    return Array.isArray(interests)
      ? interests.map((interest) => interest.name)
      : [interests.name];
  });

  function end(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 55) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  }

  return (
    <motion.article
      drag={top ? "x" : false}
      style={top ? { x, rotate } : undefined}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.32}
      onDragEnd={end}
      initial={{ scale: top ? 0.98 : 0.96, y: top ? 8 : 16, opacity: 0 }}
      animate={
        top
          ? { scale: 1, y: 0, opacity: 1 }
          : { scale: 0.96, y: 16, opacity: 0.95 }
      }
      exit={{
        x: exitDirection === "right" ? "115%" : "-115%",
        rotate: exitDirection === "right" ? 14 : -14,
        opacity: 0,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 440, damping: 34 }}
      className="absolute inset-0 overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-zinc-100 shadow-[0_18px_50px_rgba(0,0,0,0.15)] will-change-transform dark:border-white/10 dark:bg-[#121216] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] select-none"
    >
      <div className="absolute inset-0">
        {photo ? (
          <Image
            src={photo}
            alt={profile.display_name ?? "Member"}
            fill
            priority={top}
            loading={top ? "eager" : "lazy"}
            sizes="(max-width: 440px) 100vw, 420px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center bg-[#550000]/10 text-6xl font-black text-[#550000]/40 dark:bg-[#550000]/20 dark:text-red-400/40">
            {profile.display_name?.charAt(0) ?? "?"}
          </div>
        )}
      </div>

      {/* Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

      {/* Dynamic Like / Pass Stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-16 rotate-[-12deg] rounded-2xl border-2 border-[#550000] bg-[#550000]/90 px-4 py-1.5 text-lg font-black tracking-widest text-white shadow-xl"
      >
        LIKE
      </motion.div>

      <motion.div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-5 top-16 rotate-[12deg] rounded-2xl border-2 border-zinc-200 bg-black/80 px-4 py-1.5 text-lg font-black tracking-widest text-white shadow-xl"
      >
        PASS
      </motion.div>

      {/* Top Header Card Pills */}
      <div className="absolute left-3.5 right-3.5 top-3.5 flex items-start justify-between">
        <span className="max-w-[78%] truncate rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md">
          {profile.identity_context || "DateBu member"}
        </span>
        <button
          onClick={onMenu}
          aria-label="More profile options"
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-sm backdrop-blur-md transition hover:bg-black/70 active:scale-95"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Card Bio & Profile Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-semibold backdrop-blur-md ${
              verified
                ? "border-[#550000]/80 bg-[#550000]/85 text-white"
                : "border-white/20 bg-white/15 text-white/90"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>{verified ? "Verified" : "Unverified"}</span>
          </span>
          {area && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[9px] font-semibold text-white/90 backdrop-blur-md">
              <MapPin className="h-3 w-3" />
              <span>{profile.area_name || "Area verified"}</span>
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <h2 className="truncate text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {profile.display_name ?? "DateBu member"}
          </h2>
          {age !== null && (
            <span className="text-xl font-normal text-white/85">
              {age}
            </span>
          )}
        </div>

        {(profile.department || profile.academic_year) && (
          <p className="truncate text-xs font-medium text-white/80">
            {profile.department ?? ""}
            {profile.academic_year ? ` · ${profile.academic_year}` : ""}
          </p>
        )}

        {profile.bio && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/90 drop-shadow-xs">
            {profile.bio}
          </p>
        )}

        {names.length > 0 && (
          <div className="mt-2.5 flex gap-1.5 overflow-hidden">
            {names.slice(0, 4).map((name) => (
              <span
                key={name}
                className="shrink-0 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
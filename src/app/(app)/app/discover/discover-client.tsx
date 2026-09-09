"use client";

import { useEffect, useRef, useState } from "react";
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

export default function DiscoverClient({ profiles, isPro = false }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState(profiles);
  const [busy, setBusy] = useState(false);
  const pendingActionsRef = useRef(new Set<string>());
  const [toast, setToast] = useState<string | null>(null);
  const [match, setMatch] = useState<DiscoverProfile | null>(null);
  const [menu, setMenu] = useState<DiscoverProfile | null>(null);
  const [reporting, setReporting] = useState<DiscoverProfile | null>(null);
  const [reason, setReason] = useState("Inappropriate photo or content");
  const [details, setDetails] = useState("");
  const [superChat, setSuperChat] = useState<DiscoverProfile | null>(null);

  useEffect(() => setDeck(profiles), [profiles]);

  function notify(t: string) {
    setToast(t);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function act(id: string, k: "like" | "pass" | "super") {
    const p = deck.find((x) => x.id === id);
    if (!p) return;

    // Likes/passes are intentionally non-blocking. The card leaves the deck
    // immediately while the mutation completes in the background, matching
    // the interaction model used by high-volume consumer apps.
    if (k !== "super") {
      if (pendingActionsRef.current.has(id)) return;
      pendingActionsRef.current.add(id);
      setDeck((d) => d.filter((x) => x.id !== id));
      try {
        const r = k === "like" ? await likeProfile(id) : await passProfile(id);
        if (r.error) {
          setDeck((d) => [p, ...d]);
          notify(r.error);
        } else if (k === "like" && "matched" in r && r.matched) {
          setMatch(p);
        }
      } catch {
        setDeck((d) => [p, ...d]);
        notify("Something went wrong. Try again.");
      } finally {
        pendingActionsRef.current.delete(id);
      }
      return;
    }

    if (busy) return;
    setBusy(true);
    setDeck((d) => d.filter((x) => x.id !== id));
    try {
      const r = await superLikeProfile(id);
      if (r.error) {
        setDeck((d) => [p, ...d]);
        notify(r.error);
      } else {
        notify(`Super Like sent to ${p.display_name ?? "this person"}.`);
      }
    } catch {
      setDeck((d) => [p, ...d]);
      notify("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function rewind() {
    if (!isPro || busy) return;
    setBusy(true);
    const r = await rewindLastPass();
    setBusy(false);
    if (r.error) notify(r.error);
    else router.refresh();
  }

  async function review() {
    if (busy) return;
    setBusy(true);
    const r = await resetPassedProfiles();
    setBusy(false);
    if (r.error) notify(r.error);
    else if (!r.count) notify("No passed profiles to review yet.");
    else router.refresh();
  }

  async function block() {
    if (!menu) return;
    const id = menu.id;
    setMenu(null);
    const r = await blockUser(id);
    if (r.error) notify(r.error);
    else {
      setDeck((d) => d.filter((p) => p.id !== id));
      notify("Profile blocked and removed.");
    }
  }

  async function report(e: React.FormEvent) {
    e.preventDefault();
    if (!reporting) return;
    setBusy(true);
    const r = await reportUser(reporting.id, reason, details);
    setBusy(false);
    if (r.error) notify(r.error);
    else {
      setDeck((d) => d.filter((p) => p.id !== reporting.id));
      setReporting(null);
      setDetails("");
      notify("Report sent. Profile removed.");
    }
  }

  const current = deck[0];
  if (!current && !match)
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-124px)] w-full max-w-md items-center justify-center px-4 py-4 font-sans">
        <section className="w-full rounded-[2rem] border border-[#550000]/20 bg-[#550000]/5 p-7 text-center shadow-sm transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#550000] shadow-2xs dark:bg-[#121216] dark:text-red-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-[#550000] dark:text-red-400">DATING</p>
          <h1 className="mt-1 text-2xl font-black text-zinc-950 dark:text-zinc-50">You&apos;re all caught up.</h1>
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">New profiles will appear as the Extrovert community grows.</p>
          <Button onClick={() => void review()} disabled={busy} className="mt-5 w-full rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]" leftIcon={<RotateCcw className="h-4 w-4" />}>
            {busy ? "Loading…" : "Review passed profiles"}
          </Button>
        </section>
      </main>
    );

  return (
    <main className="mx-auto flex h-[calc(100dvh-124px)] min-h-0 w-full max-w-xl flex-col overflow-hidden px-2.5 pb-2 pt-2 font-sans text-zinc-950 transition-colors dark:text-zinc-50 sm:px-4 md:h-auto md:min-h-[calc(100dvh-56px)] md:overflow-visible md:pb-8 md:pt-4">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed left-1/2 top-14 z-[120] -translate-x-1/2 rounded-full border border-[#550000]/20 bg-white/95 px-4 py-2 text-xs font-bold text-zinc-900 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#121216]/95 dark:text-zinc-100">{toast}</motion.div>}
      </AnimatePresence>

      <header className="mb-2 flex shrink-0 items-center justify-between px-1">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#550000] dark:text-red-400">DATING</p>
          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">Find someone worth a hello.</h1>
        </div>
        <Link href={routes.profileSetup} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:bg-[#202028]"><SlidersHorizontal className="h-4 w-4" /></Link>
      </header>

      <div className="relative min-h-0 w-full flex-1">
        {deck.slice(0, 2).map((p, i) => (
          <SwipeCard key={p.id} profile={p} top={i === 0} onSwipe={(d) => void act(p.id, d === "right" ? "like" : "pass")} onMenu={() => setMenu(p)} />
        ))}
      </div>

      {current && (
        <div className="mt-2 flex shrink-0 items-center justify-center gap-1.5 px-1">
          <button onClick={() => void rewind()} disabled={!isPro || busy} aria-label="Rewind" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 shadow-2xs transition active:scale-95 disabled:opacity-30 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400"><RotateCcw className="h-3.5 w-3.5" /></button>
          <button onClick={() => void act(current.id, "pass")} disabled={pendingActionsRef.current.has(current.id)} aria-label="Pass" className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 disabled:opacity-30 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200"><X className="h-5 w-5" /></button>
          <button onClick={() => void act(current.id, "like")} disabled={pendingActionsRef.current.has(current.id)} aria-label="Like" className="grid h-14 w-14 place-items-center rounded-full border border-[#550000]/30 bg-[#550000] text-white shadow-lg shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"><Heart className="h-6 w-6 fill-current" /></button>
          <button onClick={() => void act(current.id, "super")} disabled={busy} aria-label="Super Like" className="grid h-11 w-11 place-items-center rounded-full border border-[#550000]/25 bg-white text-[#550000] shadow-2xs transition hover:bg-[#550000]/5 active:scale-95 disabled:opacity-30 dark:border-[#550000]/40 dark:bg-[#16161d] dark:text-red-400"><Star className="h-5 w-5 fill-current" /></button>
          <button onClick={() => setSuperChat(current)} disabled={busy} aria-label="Super Chat" className="grid h-11 w-11 place-items-center rounded-full border border-[#550000]/20 bg-white text-[#550000] shadow-2xs transition hover:bg-[#550000]/5 active:scale-95 dark:border-[#550000]/30 dark:bg-[#16161d] dark:text-red-300"><MessageCircle className="h-5 w-5" /></button>
          <Link href={`${routes.profileView}/${current.id}`} aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200"><UserRound className="h-4 w-4" /></Link>
        </div>
      )}

      <p className="mt-1 hidden text-center text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 md:block">Swipe right to like · left to pass</p>

      <AnimatePresence>
        {menu && (
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setMenu(null)}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-[1.75rem] border border-zinc-200/90 bg-white p-5 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216]">
              <div className="flex items-center justify-between"><b className="text-sm text-zinc-950 dark:text-zinc-50">Profile options</b><button onClick={() => setMenu(null)} className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"><X className="h-5 w-5" /></button></div>
              <div className="mt-4 grid gap-2">
                <Link href={`${routes.profileView}/${menu.id}`} onClick={() => setMenu(null)} className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:hover:bg-[#202028]">View full profile</Link>
                <button onClick={() => { setReporting(menu); setMenu(null); }} className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3 text-left text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300">Report profile</button>
                <button onClick={() => void block()} className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-left text-xs font-bold text-rose-800 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300">Block profile</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reporting && (
          <div className="fixed inset-0 z-[1001] grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.form onSubmit={report} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-[1.75rem] border border-zinc-200/90 bg-white p-5 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216]">
              <div className="flex items-center justify-between"><b className="text-sm text-zinc-950 dark:text-zinc-50">Report profile</b><button type="button" onClick={() => setReporting(null)} className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"><X className="h-5 w-5" /></button></div>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-4 h-11 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3 text-xs font-semibold text-zinc-900 focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100"><option>Inappropriate photo or content</option><option>Harassment or abusive behavior</option><option>Fake or impersonated profile</option><option>Spam or commercial advertising</option><option>Underage user</option><option>Other safety concern</option></select>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={4} placeholder="What happened? (optional)" className="mt-2 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100" />
              <div className="mt-3 flex gap-2"><Button type="button" variant="outline" onClick={() => setReporting(null)} className="flex-1 rounded-2xl border-zinc-200 dark:border-white/10">Cancel</Button><Button type="submit" disabled={busy} className="flex-1 rounded-2xl border border-[#550000]/30 bg-[#550000] text-white hover:bg-[#680202] dark:bg-[#550000] dark:hover:bg-[#6e0303]" leftIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>{busy ? "Sending" : "Send report"}</Button></div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {match && (
          <div className="fixed inset-0 z-[1002] grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-[2rem] border border-zinc-200/90 bg-white p-7 text-center shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216]">
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-[#550000]/20 bg-[#550000]/5 dark:border-[#550000]/35 dark:bg-[#550000]/20">{match.profile_photo_url ? <Image src={match.profile_photo_url} alt="" width={96} height={96} className="h-full w-full object-cover" /> : <Heart className="h-9 w-9 fill-current text-[#550000] dark:text-red-400" />}</div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#550000] dark:text-red-400">IT&apos;S A MATCH</p>
              <h2 className="mt-1 text-3xl font-black text-zinc-950 dark:text-zinc-50">You both liked each other.</h2>
              <Link href={routes.messages} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-black text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 dark:bg-[#550000] dark:hover:bg-[#6e0303]"><MessageCircle className="h-4 w-4" />Open chat</Link>
              <button onClick={() => setMatch(null)} className="mt-3 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">Keep discovering</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {superChat && <SuperChatComposer targetUserId={superChat.id} targetName={superChat.display_name ?? "Member"} onClose={() => setSuperChat(null)} />}
    </main>
  );
}

function SwipeCard({ profile, top, onSwipe, onMenu }: { profile: DiscoverProfile; top: boolean; onSwipe: (d: "left" | "right") => void; onMenu: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [12, 55], [0, 1]);
  const passOpacity = useTransform(x, [-55, -12], [1, 0]);
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const photo = profile.profile_photos?.find((p) => p.is_primary)?.url ?? profile.profile_photo_url;
  const verified = profile.verification_status === "verified";
  const area = profile.area_verification_status === "verified";
  const names = (profile.profile_interests ?? []).flatMap((v) => { const x = v.interests; if (!x) return []; return Array.isArray(x) ? x.map((i) => i.name) : [x.name]; });

  function end(_: MouseEvent | TouchEvent | PointerEvent, i: PanInfo) { if (Math.abs(i.offset.x) > 55) onSwipe(i.offset.x > 0 ? "right" : "left"); }

  return (
    <motion.article drag={top ? "x" : false} style={top ? { x, rotate } : undefined} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.32} onDragEnd={end} animate={top ? { scale: 1, y: 0 } : { scale: 0.965, y: 18 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-zinc-200/90 bg-zinc-100 shadow-[0_18px_55px_rgba(15,23,42,.13)] will-change-transform dark:border-white/10 dark:bg-[#121216]">
      <div className="absolute inset-0">{photo ? <Image src={photo} alt="" fill priority={top} loading="eager" sizes="(max-width:640px) 100vw,560px" className="object-cover" /> : <div className="grid h-full place-items-center bg-[#550000]/5 text-6xl font-black text-[#550000]/25 dark:bg-[#550000]/20 dark:text-red-400/30">{profile.display_name?.charAt(0) ?? "?"}</div>}</div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20" />
      <motion.div style={{ opacity: likeOpacity }} className="pointer-events-none absolute left-5 top-20 rotate-[-10deg] rounded-2xl border-2 border-emerald-400 bg-emerald-500/80 px-4 py-2 text-xl font-black tracking-widest text-white shadow-xl">LIKE</motion.div>
      <motion.div style={{ opacity: passOpacity }} className="pointer-events-none absolute right-5 top-20 rotate-[10deg] rounded-2xl border-2 border-rose-300 bg-rose-500/80 px-4 py-2 text-xl font-black tracking-widest text-white shadow-xl">PASS</motion.div>
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between"><span className="max-w-[78%] rounded-full border border-white/40 bg-white/90 px-2.5 py-1.5 text-[9px] font-black text-zinc-800 shadow-2xs backdrop-blur-xs">{profile.identity_context || "Extrovert member"}</span><button onClick={onMenu} className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/90 text-zinc-700 shadow-2xs transition hover:bg-white active:scale-95"><MoreHorizontal className="h-4 w-4" /></button></div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-5">
        <div className="flex flex-wrap gap-1.5"><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[9px] font-black backdrop-blur-xs ${verified ? "border-emerald-200 bg-emerald-500/85 text-white" : "border-white/30 bg-white/15 text-white"}`}><ShieldCheck className="h-3 w-3" />{verified ? "Face verified" : "Face not verified"}</span><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[9px] font-black shadow-lg backdrop-blur-xs ${area ? "border-[#550000]/30 bg-[#550000]/90 text-white" : "border-white/30 bg-black/45 text-white/75"}`}><MapPin className="h-3 w-3" />{area ? `Area verified${profile.area_name ? ` · ${profile.area_name}` : ""}` : "Area not verified"}</span></div>
        <div className="mt-3 flex items-end justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-3xl font-black tracking-tight text-white">{profile.display_name || "Member"}{age !== null && <span className="ml-1.5 text-xl font-medium text-white/75">{age}</span>}</h2><p className="mt-1 text-[11px] font-semibold text-white/80">{profile.department || profile.academic_year || ""}</p></div></div>
        {profile.bio && <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/85">{profile.bio}</p>}
        {names.length > 0 && <div className="mt-2 flex gap-1.5 overflow-hidden">{names.slice(0, 4).map((n) => <span key={n} className="shrink-0 rounded-full bg-white/20 px-2 py-1 text-[9px] font-bold text-white/90 backdrop-blur-xs">{n}</span>)}</div>}
      </div>
    </motion.article>
  );
}

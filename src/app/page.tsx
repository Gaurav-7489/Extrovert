import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  BellRing,
  CalendarDays,
  Camera,
  Compass,
  Crosshair,
  Crown,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Users,
  Zap,
} from "lucide-react";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";
import { SwipeStoryDeck } from "@/components/home/swipe-story-deck";

const pillars = [
  {
    icon: Users,
    number: "01",
    title: "People, not profiles",
    text: "Discover nearby people with enough context to know whether a hello is worth it.",
  },
  {
    icon: CalendarDays,
    number: "02",
    title: "Plans that leave the chat",
    text: "Create something to do, find people who are in, and turn maybe into happening.",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Conversation with context",
    text: "Matches, plan chats and shared interests give you somewhere better to start.",
  },
];

const safetyMoves = [
  { icon: Ban, label: "BLOCK", detail: "End access instantly." },
  { icon: Flag, label: "REPORT", detail: "Send it to moderation." },
  { icon: ArrowRight, label: "MOVE ON", detail: "Keep your space yours." },
];

const featureGrid = [
  {
    icon: Compass,
    label: "Discover",
    text: "Swipe through people who fit your dating preferences.",
    tone: "brand",
  },
  {
    icon: Crosshair,
    label: "Nearby",
    text: "See people in your verified locality without exposing exact coordinates.",
    tone: "success",
  },
  {
    icon: CalendarDays,
    label: "Plans",
    text: "Start real-world plans, approve requests and keep the plan chat together.",
    tone: "warning",
  },
  {
    icon: MessageCircle,
    label: "Matches & chat",
    text: "Mutual likes become conversations with secure message keys.",
    tone: "info",
  },
  {
    icon: Camera,
    label: "Trust",
    text: "Optional live-camera face verification plus precise area verification.",
    tone: "success",
  },
  {
    icon: RotateCcw,
    label: "Second look",
    text: "Review passed profiles and rewind the latest pass with Beyond.",
    tone: "warning",
  },
  {
    icon: Crown,
    label: "Beyond",
    text: "Premium controls such as rewind, profile insights and enhanced discovery.",
    tone: "brand",
  },
  {
    icon: BellRing,
    label: "Notifications",
    text: "Likes, matches, chats and plan activity can reach your device instantly.",
    tone: "info",
  },
];

export default function HomePage() {
  return (
    <main className="extrovert-neon-grid relative mx-auto min-h-[100svh] w-full max-w-[52rem] overflow-hidden bg-[#030304] px-4 pb-10 pt-[max(.8rem,env(safe-area-inset-top))] text-white supports-[height:100dvh]:min-h-[100dvh] sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(255,10,134,.13),transparent_62%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-[38rem] h-72 w-72 rounded-full bg-[rgb(var(--brand-red)/.06)] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-[78rem] h-72 w-72 rounded-full bg-sky-400/[.035] blur-3xl" aria-hidden="true" />

      <header className="relative z-20">
        <nav className="flex h-12 items-center justify-between">
          <Link href={routes.home} className="pressable" aria-label="Extrovert home">
            <BrandLogo size={30} />
          </Link>
          <Link
            href={routes.login}
            className="pressable inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[.1] bg-white/[.035] px-3.5 text-[10px] font-black tracking-wide text-zinc-200 backdrop-blur-xl"
          >
            SIGN IN
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <section className="relative z-10 pt-9">
        <div className="landing-rise landing-delay-1 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_12px_rgb(var(--brand-red)/.95)]" />
          Extrovert · social + dating
        </div>

        <h1 className="landing-rise landing-delay-2 mt-5 text-[clamp(3rem,12vw,5.75rem)] font-black leading-[.88] tracking-[-.075em]">
          MEET.
          <br />
          MATCH.
          <br />
          <span className="neon-word">VIBE.</span>
        </h1>

        <p className="landing-rise landing-delay-3 mt-5 max-w-[31ch] text-[13px] leading-6 text-zinc-400">
          People near you. Plans worth leaving home for. Conversations that actually have somewhere to go.
        </p>

        <div className="landing-rise landing-delay-4 mt-6 grid grid-cols-[1fr_auto] gap-2.5">
          <Link
            href={routes.register}
            className="neon-cta pressable inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-xs font-black tracking-[.04em] text-white"
          >
            JOIN EXTROVERT
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={routes.safety}
            aria-label="Extrovert safety"
            className="pressable grid h-12 w-12 place-items-center rounded-full border border-white/[.09] bg-white/[.035] text-zinc-300 backdrop-blur-xl"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </div>

        <div className="landing-rise landing-delay-5 relative mt-8 h-[272px] overflow-hidden rounded-[32px] border border-white/[.055] bg-[#060607]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,10,134,.09),transparent_48%)]" />
          <div className="neon-orbit-ring absolute left-1/2 top-1/2 h-[202px] w-[202px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--brand-red)/.14)]">
            <span className="neon-orbit-dot absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-[rgb(var(--brand-red))]" />
            <span className="absolute -right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[rgb(var(--brand-red)/.72)] shadow-[0_0_12px_rgb(var(--brand-red)/.7)]" />
            <span className="absolute -bottom-1 left-[28%] h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,.55)]" />
          </div>
          <div className="neon-orbit-ring-slow absolute left-1/2 top-1/2 h-[142px] w-[142px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.06]">
            <span className="absolute -left-1 top-[38%] h-2 w-2 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_14px_rgb(var(--brand-red)/.8)]" />
          </div>

          <div className="absolute left-1/2 top-1/2 grid h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/[.11] bg-[#0b0b0e] shadow-[0_0_42px_rgba(255,10,134,.12)]">
            <div className="text-center">
              <Zap className="mx-auto h-5 w-5 fill-[rgb(var(--brand-red))] text-[rgb(var(--brand-red))]" />
              <p className="mt-1 text-[8px] font-black tracking-[.16em] text-white">YOU</p>
            </div>
          </div>

          <div className="absolute left-4 top-5 rounded-full border border-white/[.07] bg-black/55 px-3 py-1.5 text-[9px] font-bold text-zinc-400 backdrop-blur-md">
            <Users className="mr-1.5 inline h-3 w-3 text-[rgb(var(--brand-red))]" />
            PEOPLE
          </div>
          <div className="absolute right-4 top-[46%] rounded-full border border-emerald-500/15 bg-black/55 px-3 py-1.5 text-[9px] font-bold text-zinc-400 backdrop-blur-md">
            <CalendarDays className="mr-1.5 inline h-3 w-3 text-emerald-400" />
            PLANS
          </div>
          <div className="absolute bottom-5 left-5 rounded-full border border-sky-500/15 bg-black/55 px-3 py-1.5 text-[9px] font-bold text-zinc-400 backdrop-blur-md">
            <MessageCircle className="mr-1.5 inline h-3 w-3 text-sky-400" />
            CHATS
          </div>

          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-zinc-600">less feed</p>
            <p className="mt-0.5 text-[10px] font-black text-white">more real life</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-[rgb(var(--brand-red))]">THE FEEL</p>
            <h2 className="mt-2 text-[30px] font-black leading-[.95] tracking-[-.055em]">
              Not another
              <br />
              dead feed.
            </h2>
          </div>
          <p className="max-w-[14ch] text-right text-[10px] leading-4 text-zinc-600">
            Drag the top card. The product should feel alive before you even sign in.
          </p>
        </div>
        <SwipeStoryDeck />
      </section>

      <section className="relative z-10 mt-14">
        <div className="landing-section-rule" />
        <p className="mt-7 text-[9px] font-black uppercase tracking-[.22em] text-zinc-600">WHAT IS EXTROVERT?</p>
        <h2 className="mt-2 text-[36px] font-black leading-[.95] tracking-[-.06em]">
          Your social graph,
          <br />
          <span className="neon-word">in motion.</span>
        </h2>
        <p className="mt-4 max-w-[33ch] text-[12px] leading-5 text-zinc-500">
          Dating when you want it. Social plans when you do not. One identity, one place, less friction.
        </p>

        <div className="relative mt-7 h-[282px] overflow-hidden rounded-[30px] border border-white/[.06] bg-[#060607]">
          <svg
            viewBox="0 0 320 260"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="networkStroke" x1="0" x2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,.08)" />
                <stop offset="48%" stopColor="rgba(255,10,134,.75)" />
                <stop offset="100%" stopColor="rgba(255,255,255,.08)" />
              </linearGradient>
            </defs>
            <path className="neon-line-draw" d="M160 130 L72 62" stroke="url(#networkStroke)" strokeWidth="1.1" fill="none" />
            <path className="neon-line-draw landing-delay-2" d="M160 130 L245 58" stroke="url(#networkStroke)" strokeWidth="1.1" fill="none" />
            <path className="neon-line-draw landing-delay-3" d="M160 130 L62 196" stroke="url(#networkStroke)" strokeWidth="1.1" fill="none" />
            <path className="neon-line-draw landing-delay-4" d="M160 130 L256 194" stroke="url(#networkStroke)" strokeWidth="1.1" fill="none" />
            <path className="neon-line-draw landing-delay-5" d="M160 130 L161 30" stroke="url(#networkStroke)" strokeWidth="1.1" fill="none" />
          </svg>

          {[
            ["50%", "50%", "YOU"],
            ["22%", "23%", "MEET"],
            ["77%", "22%", "MATCH"],
            ["19%", "75%", "PLAN"],
            ["80%", "74%", "CHAT"],
            ["50%", "11%", "VIBE"],
          ].map(([left, top, label], index) => (
            <div
              key={label}
              className={
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-[#0a0a0d] text-[8px] font-black tracking-[.12em] " +
                (index === 0
                  ? "h-[70px] w-[70px] border-[rgb(var(--brand-red)/.4)] text-white shadow-[0_0_34px_rgb(var(--brand-red)/.14)]"
                  : "h-[50px] w-[50px] border-white/[.1] text-zinc-500")
              }
              style={{ left, top }}
            >
              {index === 0 ? (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--brand-red))] text-white shadow-[0_0_18px_rgb(var(--brand-red)/.55)]">
                  <Heart className="h-4 w-4 fill-current" />
                </span>
              ) : (
                label
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {pillars.map(({ icon: Icon, number, title, text }) => (
            <article
              key={title}
              className="content-auto group flex items-start gap-3 rounded-[22px] border border-white/[.06] bg-white/[.02] p-4"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-[rgb(var(--brand-red)/.14)] bg-[rgb(var(--brand-red)/.07)] text-[rgb(var(--brand-red))]">
                <Icon className="h-[17px] w-[17px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black tracking-[-.02em] text-zinc-100">{title}</p>
                <p className="mt-1 text-[10px] leading-[1.15rem] text-zinc-500">{text}</p>
              </div>
              <span className="pt-1 text-[9px] font-black text-zinc-700">{number}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-14">
        <div className="landing-section-rule" />
        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-zinc-600">
              INSIDE EXTROVERT
            </p>
            <h2 className="mt-2 text-[34px] font-black leading-[.94] tracking-[-.06em]">
              One app.
              <br />
              <span className="neon-word">More ways to meet.</span>
            </h2>
          </div>
          <span className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-[8px] font-black tracking-[.12em] text-zinc-500">
            SOCIAL + DATING
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {featureGrid.map(({ icon: Icon, label, text, tone }) => {
            const toneClass =
              tone === "success"
                ? "border-emerald-500/15 bg-emerald-500/[.055] text-emerald-300"
                : tone === "warning"
                ? "border-amber-500/15 bg-amber-500/[.055] text-amber-300"
                : tone === "info"
                ? "border-sky-500/15 bg-sky-500/[.055] text-sky-300"
                : "border-[rgb(var(--brand-red)/.16)] bg-[rgb(var(--brand-red)/.055)] text-[rgb(var(--brand-red))]";

            return (
              <article
                key={label}
                className="content-auto rounded-[22px] border border-white/[.06] bg-white/[.018] p-3.5 transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-[13px] border ${toneClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-[11px] font-black tracking-[-.01em] text-zinc-100">
                  {label}
                </h3>
                <p className="mt-1 text-[9px] leading-4 text-zinc-600">{text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mt-14 overflow-hidden rounded-[30px] border border-[rgb(var(--brand-red)/.12)] bg-[#060607] p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[rgb(var(--brand-red)/.08)] blur-3xl" aria-hidden="true" />
        <p className="relative text-[9px] font-black uppercase tracking-[.22em] text-zinc-600">DATE SMART. SOCIAL SMARTER.</p>
        <h2 className="relative mt-2 max-w-[8ch] text-[34px] font-black leading-[.92] tracking-[-.06em]">
          Your safety
          <span className="neon-word"> matters.</span>
        </h2>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          {[
            ["PUBLIC", MapPin, "Meet where people are."],
            ["PRIVATE", ShieldCheck, "Keep personal info personal."],
            ["TRUST", Users, "Tell someone you trust."],
          ].map(([label, Icon, text]) => {
            const SafetyIcon = Icon as typeof MapPin;
            return (
              <div key={String(label)} className="rounded-[18px] border border-white/[.07] bg-black/40 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-[rgb(var(--brand-red)/.22)] text-[rgb(var(--brand-red))]">
                  <SafetyIcon className="h-3.5 w-3.5" />
                </span>
                <p className="mt-3 text-[9px] font-black tracking-[.12em] text-zinc-200">{String(label)}</p>
                <p className="mt-1 text-[9px] leading-4 text-zinc-600">{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mt-14">
        <div className="landing-section-rule" />
        <div className="mt-7">
          <p className="text-[9px] font-black uppercase tracking-[.22em] text-zinc-600">SOMETHING FEELS WRONG?</p>
          <h2 className="mt-2 text-[36px] font-black leading-[.94] tracking-[-.06em]">
            Trust your
            <br />
            <span className="neon-word">instincts.</span>
          </h2>
          <p className="mt-3 text-[13px] font-black tracking-[-.02em] text-zinc-200">
            BLOCK. REPORT. MOVE ON.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {safetyMoves.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="rounded-[20px] border border-white/[.06] bg-white/[.02] p-3 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--brand-red)/.22)] text-[rgb(var(--brand-red))]">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[9px] font-black tracking-[.1em] text-zinc-200">{label}</p>
              <p className="mt-1 text-[8px] leading-3 text-zinc-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-14 overflow-hidden rounded-[30px] border border-white/[.07] bg-[linear-gradient(145deg,#08080a,#050506)] p-5">
        <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full border border-[rgb(var(--brand-red)/.18)]" aria-hidden="true">
          <span className="absolute left-4 top-2 h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_12px_rgb(var(--brand-red))]" />
        </div>
        <Sparkles className="h-5 w-5 text-[rgb(var(--brand-red))]" />
        <h2 className="mt-4 text-[34px] font-black leading-[.92] tracking-[-.06em]">
          Stop saving
          <br />
          life for later.
        </h2>
        <p className="mt-3 max-w-[31ch] text-[11px] leading-5 text-zinc-500">
          Build your profile, choose your mode, and find out what is happening around you.
        </p>
        <Link
          href={routes.register}
          className="neon-cta pressable mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[11px] font-black tracking-[.06em] text-white"
        >
          START WITH GOOGLE
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="relative z-10 mt-10 border-t border-white/[.06] px-1 pt-5">
        <div className="flex items-center justify-between">
          <BrandLogo size={25} />
          <span className="text-[8px] font-bold tracking-[.14em] text-zinc-700">MEET · MATCH · VIBE</span>
        </div>
        <div className="mt-5 flex items-center justify-between text-[9px] font-semibold text-zinc-700">
          <span>© {new Date().getFullYear()} Extrovert</span>
          <div className="flex gap-3.5">
            <Link href={routes.privacy}>Privacy</Link>
            <Link href={routes.terms}>Terms</Link>
            <Link href={routes.safety}>Safety</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

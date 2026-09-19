import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";

const moments = [
  {
    icon: Users,
    title: "Find your people",
    text: "Discover nearby people who actually match your vibe.",
  },
  {
    icon: Sparkles,
    title: "Make a plan",
    text: "Turn “we should hang out” into something that is actually happening.",
  },
  {
    icon: MessageCircle,
    title: "Keep it moving",
    text: "Match, connect, and chat without bouncing between apps.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#07080b] px-3.5 pb-10 pt-[max(.75rem,env(safe-area-inset-top))] text-zinc-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--brand-red)/.13)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-52 h-64 w-64 rounded-full bg-amber-400/[.055] blur-3xl"
      />

      <header className="relative z-10">
        <nav className="extrovert-glass flex h-14 items-center justify-between rounded-[20px] px-2.5">
          <Link href={routes.home} aria-label="Extrovert home">
            <BrandLogo size={32} />
          </Link>
          <Link
            href={routes.login}
            className="pressable rounded-[14px] border border-white/10 bg-white/[.055] px-4 py-2 text-[11px] font-extrabold text-zinc-100"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="relative z-10 pt-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--brand-red)/.2)] bg-[rgb(var(--brand-red)/.08)] px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[rgb(var(--brand-red))]">
          <Zap className="h-3.5 w-3.5 fill-current" />
          PEOPLE. PLANS. REAL LIFE.
        </div>

        <h1 className="mt-5 text-[46px] font-black leading-[.96] tracking-[-.065em]">
          Less scrolling.
          <br />
          <span className="bg-[linear-gradient(100deg,#fff_8%,rgb(var(--brand-red))_76%)] bg-clip-text text-transparent">
            More stories.
          </span>
        </h1>

        <p className="mt-5 max-w-[32ch] text-[13px] leading-6 text-zinc-400">
          Extrovert helps you discover people, make plans, match, and turn nearby moments into real connections.
        </p>

        <div className="mt-7 grid grid-cols-[1fr_auto] gap-2.5">
          <Link
            href={routes.register}
            className="extrovert-brand-glow pressable inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[rgb(var(--brand-red))] px-5 text-sm font-black text-white"
          >
            Enter Extrovert
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={routes.safety}
            aria-label="Safety at Extrovert"
            className="pressable grid h-12 w-12 place-items-center rounded-[18px] border border-white/10 bg-white/[.045] text-zinc-300"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="relative z-10 mt-9">
        <div className="extrovert-surface overflow-hidden rounded-[28px] p-3">
          <div className="relative overflow-hidden rounded-[22px] border border-white/[.075] bg-[#0c0e13] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[rgb(var(--brand-red))]">
                  Happening around you
                </p>
                <h2 className="mt-1 text-lg font-black tracking-[-.035em]">
                  Your next good story starts nearby.
                </h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--brand-red)/.12)] text-[rgb(var(--brand-red))]">
                <Heart className="h-5 w-5 fill-current" />
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Discover", "Plans", "Chats"].map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/[.07] bg-white/[.035] px-2 py-3 text-center"
                >
                  <div
                    className="mx-auto mb-2 h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-red))]"
                    style={{ opacity: 1 - index * 0.22 }}
                  />
                  <p className="text-[10px] font-extrabold text-zinc-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-7 space-y-2.5">
        {moments.map(({ icon: Icon, title, text }, index) => (
          <article
            key={title}
            className="content-auto flex items-start gap-3 rounded-[22px] border border-white/[.075] bg-white/[.025] p-4"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-[rgb(var(--brand-red)/.1)] text-[rgb(var(--brand-red))]">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold tracking-[-.02em]">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">{text}</p>
            </div>
            <span className="ml-auto pt-1 text-[10px] font-black text-zinc-700">
              0{index + 1}
            </span>
          </article>
        ))}
      </section>

      <section className="relative z-10 mt-7 rounded-[24px] border border-white/[.075] bg-white/[.025] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(var(--brand-red))]" />
          <div>
            <h2 className="text-xs font-extrabold">Built for real people, with real controls.</h2>
            <p className="mt-1 text-[10px] leading-5 text-zinc-500">
              Verification, privacy, blocking, reporting, and safety tools live inside the experience instead of hiding in the fine print.
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mt-8 flex items-center justify-between border-t border-white/[.07] px-1 pt-5 text-[9px] font-semibold text-zinc-600">
        <span>© {new Date().getFullYear()} Extrovert</span>
        <div className="flex gap-3.5">
          <Link href={routes.privacy}>Privacy</Link>
          <Link href={routes.terms}>Terms</Link>
          <Link href={routes.safety}>Safety</Link>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { routes } from "@/config/routes";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f8] font-sans text-zinc-950 transition-colors dark:bg-[#0a0a0c] dark:text-zinc-100">
      {/* Header */}
      <header className="relative z-20 px-4 pt-4 sm:px-6">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2.5 shadow-2xs backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#121216]/90 sm:px-5">
          <Link href={routes.home} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#550000] text-white shadow-md shadow-[#550000]/25 dark:bg-[#550000]">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <span className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              DateBu<span className="text-[#550000] dark:text-red-400">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1.5 sm:flex">
            <Link
              href={routes.about}
              className="rounded-full px-3.5 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            >
              About
            </Link>
            <Link
              href={routes.safety}
              className="rounded-full px-3.5 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            >
              Safety
            </Link>
            <Link
              href={routes.login}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-2xs transition hover:bg-zinc-50 dark:border-white/10 dark:bg-[#181820] dark:text-zinc-200 dark:hover:bg-[#202028]"
            >
              Sign in
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link
              href={routes.register}
              className="rounded-full border border-[#550000]/30 bg-[#550000] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[#550000]/10 blur-3xl dark:bg-[#550000]/15" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#550000]/20 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] shadow-2xs backdrop-blur-xs dark:border-[#550000]/35 dark:bg-[#121216]/80 dark:text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dating + Social Connection</span>
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.05em] sm:text-7xl">
              Meet people.
              <br />
              <span className="text-[#550000] dark:text-red-400">
                Make it real.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              DateBu brings authentic dating and student connections into one space. Discover genuine profiles, connect with campus crowds, match mutually, and chat with confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={routes.register}
                className="inline-flex items-center gap-2 rounded-full border border-[#550000]/30 bg-[#550000] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
              >
                <span>Start on DateBu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={routes.about}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 shadow-2xs transition hover:border-[#550000]/30 hover:text-[#550000] dark:border-white/10 dark:bg-[#121216] dark:text-zinc-200 dark:hover:border-[#550000]/40 dark:hover:text-red-300"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
                <span>Camera-liveness verification</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
                <span>Privacy-preserving area zones</span>
              </span>
            </div>
          </div>

          {/* Interactive Card Mockup */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-[#550000]/20 blur-2xl dark:bg-[#550000]/30" />
            <div className="relative rounded-[2.25rem] border border-zinc-200/90 bg-white p-3 shadow-2xl transition-colors dark:border-white/10 dark:bg-[#121216]">
              <div className="rounded-[1.75rem] bg-zinc-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-tight text-white">
                    DateBu
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[9px] font-bold">
                    Discover
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#550000] via-[#7a0d0d] to-zinc-950 p-5">
                  <div className="flex h-72 flex-col justify-end rounded-[1.25rem] border border-white/20 bg-black/20 p-4 backdrop-blur-xs">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      Someone new
                    </span>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Your next spark.
                    </h2>
                    <p className="mt-2 text-xs text-white/80">
                      Swipe, connect, and move straight into authentic conversations.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/5 bg-white/10 p-3 text-center transition hover:bg-white/15">
                    <Heart className="mx-auto h-4 w-4 text-white" />
                    <span className="mt-1 block text-[10px] font-bold text-white">
                      Like
                    </span>
                  </div>
                  <div className="rounded-2xl border border-[#550000]/50 bg-[#550000] p-3 text-center shadow-sm">
                    <Zap className="mx-auto h-4 w-4 text-white" />
                    <span className="mt-1 block text-[10px] font-bold text-white">
                      Super Like
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/10 p-3 text-center transition hover:bg-white/15">
                    <MessageCircle className="mx-auto h-4 w-4 text-white" />
                    <span className="mt-1 block text-[10px] font-bold text-white">
                      Chat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Experience Pillars */}
      <section className="border-y border-zinc-200/80 bg-white px-4 py-14 transition-colors dark:border-white/10 dark:bg-[#121216] sm:px-6 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#550000] dark:text-red-400">
              One account. Two ways to connect.
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Dating when you want chemistry. Social when you want community.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[2rem] border border-[#550000]/20 bg-[#550000]/5 p-6 shadow-2xs transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#550000] text-white shadow-2xs">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-zinc-950 dark:text-zinc-50">
                Dating
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Explore profiles, filter by age or department, send likes, match mutually, and chat securely.
              </p>
              <Link
                href={routes.discover}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#550000] hover:underline dark:text-red-300"
              >
                <span>Open Dating</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>

            <article className="rounded-[2rem] border border-zinc-200/90 bg-zinc-50/80 p-6 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#16161d]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-white shadow-2xs dark:bg-zinc-800">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-zinc-950 dark:text-zinc-50">
                Social
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Find people across your campus and nearby areas without ever exposing your exact personal coordinates.
              </p>
              <Link
                href={routes.social}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:underline dark:text-zinc-200"
              >
                <span>Open Social</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Compass,
              title: "Discover",
              text: "Browse profiles filtered to your precise preferences and campus location.",
            },
            {
              icon: Users,
              title: "Social",
              text: "Connect with students nearby while keeping your exact location private.",
            },
            {
              icon: MessageCircle,
              title: "Chat",
              text: "Turn mutual likes into smooth, encrypted real-time conversations.",
            },
            {
              icon: ShieldCheck,
              title: "Control",
              text: "Biometric liveness, blocking, ghost mode, and report controls stay in your hands.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#550000]/20 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/90 bg-white px-4 py-8 transition-colors dark:border-white/10 dark:bg-[#121216] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DateBu</span>
          <div className="flex gap-4">
            <Link
              href={routes.safety}
              className="transition hover:text-[#550000] dark:hover:text-red-300"
            >
              Safety
            </Link>
            <Link
              href={routes.privacy}
              className="transition hover:text-[#550000] dark:hover:text-red-300"
            >
              Privacy
            </Link>
            <Link
              href={routes.terms}
              className="transition hover:text-[#550000] dark:hover:text-red-300"
            >
              Terms
            </Link>
            <Link
              href={routes.login}
              className="transition hover:text-[#550000] dark:hover:text-red-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
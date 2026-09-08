import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] font-sans text-zinc-100">
      <header className="px-4 pt-4 sm:px-6">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#121216]/95 px-4 py-2.5 shadow-lg">
          <Link href={routes.home} aria-label="Extrovert home">
            <BrandLogo size={34} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href={routes.about} className="hidden rounded-full px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-100 sm:block">
              About
            </Link>
            <Link href={routes.safety} className="hidden rounded-full px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-100 sm:block">
              Safety
            </Link>
            <Link href={routes.login} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-white/5">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#550000]/25 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#550000]/40 bg-[#550000]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-red-300">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Extrovert
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-[-.055em] sm:text-7xl">
            Meet people.
            <br />
            <span className="text-red-400">Make it real.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Discover people, connect, match, and chat.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href={routes.register} className="inline-flex items-center gap-2 rounded-full bg-[#550000] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#550000]/30 hover:bg-[#680202] active:scale-95">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={routes.safety} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121216] px-6 py-3.5 text-sm font-bold text-zinc-200 hover:bg-white/5">
              Safety
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#121216] px-5 py-10 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            [Users, "Discover", "Find people that fit your preferences."],
            [Heart, "Match", "Like each other and connect."],
            [MessageCircle, "Chat", "Move from a match to a conversation."],
          ].map(([Icon, title, text]) => (
            <article key={title as string} className="rounded-3xl border border-white/10 bg-[#16161d] p-5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#550000]/20 text-red-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-sm font-black">{title as string}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{text as string}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-3xl border border-white/10 bg-[#121216] p-5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-red-300" />
          <p className="text-xs leading-5 text-zinc-400">
            Safety, verification, blocking, reporting, and privacy controls are built into Extrovert.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-7 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-[11px] text-zinc-500">
          <span>© {new Date().getFullYear()} Extrovert</span>
          <div className="flex gap-4">
            <Link href={routes.privacy}>Privacy</Link>
            <Link href={routes.terms}>Terms</Link>
            <Link href={routes.safety}>Safety</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

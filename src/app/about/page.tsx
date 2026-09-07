import Link from "next/link";
import { ArrowRight, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { routes } from "@/config/routes";

const features = [
  { icon: Heart, title: "Dating", text: "Discover profiles, set your preferences, like people and turn mutual likes into matches." },
  { icon: Users, title: "Social", text: "Find people in your local community and send connection requests without exposing an exact location." },
  { icon: MessageCircle, title: "Chat", text: "Matches and accepted social connections get a real conversation space with modern messaging." },
  { icon: ShieldCheck, title: "Identity verification", text: "Optional identity verification helps people know an account has completed a trusted identity check." },
  { icon: MapPin, title: "Area privacy", text: "Extrovert can show an approximate area instead of publishing someone's exact coordinates." },
  { icon: Sparkles, title: "Built to grow", text: "Premium features, notifications, safety tools and profile controls live inside the same Extrovert account." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7fbf9] text-zinc-950 antialiased">
      <Navbar />
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
        <section className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-emerald-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> About Extrovert</span>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">A place to meet people without needing two different apps.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">Extrovert combines dating and social discovery in one account. You decide whether you are looking for a date, new friends, local connections, or simply someone interesting to talk to.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href={routes.register} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">Join Extrovert <ArrowRight className="h-4 w-4" /></Link><Link href={routes.safety} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 hover:border-emerald-200 hover:text-emerald-700"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Safety</Link></div>
            </div>
            <div className="rounded-[2.25rem] border border-zinc-200 bg-white p-3 shadow-[0_30px_90px_rgba(15,23,42,.12)]"><div className="rounded-[1.75rem] bg-zinc-950 p-5 text-white"><div className="flex items-center justify-between"><span className="font-black">Extrovert</span><span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[9px] font-bold text-emerald-300">Dating + Social</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-3xl bg-white/10 p-5"><Heart className="h-5 w-5 text-emerald-300"/><p className="mt-4 text-lg font-black">Find your match.</p><p className="mt-1 text-xs leading-5 text-white/60">Swipe, like, match and chat.</p></div><div className="rounded-3xl bg-white/10 p-5"><Users className="h-5 w-5 text-emerald-300"/><p className="mt-4 text-lg font-black">Find your people.</p><p className="mt-1 text-xs leading-5 text-white/60">Explore your local social world.</p></div></div></div></div>
          </div>
        </section>
        <section className="mx-auto mt-20 max-w-6xl"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">What is inside</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Everything belongs to one Extrovert account.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">No separate identity, no duplicate profile and no bouncing between products. Dating, Social, Chat, Profile, Safety and Settings are connected.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon:Icon,title,text })=><article key={title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5"/></div><h3 className="mt-4 text-base font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-600">{text}</p></article>)}</div></section>
        <section className="mx-auto mt-20 max-w-5xl rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 sm:p-10"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Ready?</p><h2 className="mt-2 text-2xl font-black">Make your Extrovert profile.</h2><p className="mt-2 text-sm leading-6 text-emerald-950/65">Add photos, interests, preferences and the things that make you you.</p></div><Link href={routes.register} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-700">Get started <ArrowRight className="h-4 w-4"/></Link></div></section>
      </main>
      <Footer />
    </div>
  );
}

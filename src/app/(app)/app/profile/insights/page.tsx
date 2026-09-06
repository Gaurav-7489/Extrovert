import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Eye, Heart, Lock, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Dating Insights | Extrovert" };
export const dynamic = "force-dynamic";

function Stat({ icon: Icon, label, value, detail }: { icon: typeof Heart; label: string; value: number; detail: string }) {
  return <article className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#faf0f2] text-[#761f30]"><Icon className="h-4 w-4" /></div><span className="text-2xl font-black text-zinc-950">{value}</span></div><p className="mt-3 text-xs font-black text-zinc-950">{label}</p><p className="mt-1 text-[10px] leading-4 text-zinc-500">{detail}</p></article>;
}

export default async function DatingInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const [{ data: subscription }, { data: identity }] = await Promise.all([
    supabase.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle(),
    supabase.from("extrovert_profiles").select("gender").eq("id", user.id).maybeSingle(),
  ]);
  const isWoman = ["woman", "female"].includes((identity?.gender ?? "").toLowerCase());
  const isPro = isWoman || (subscription?.plan === "pro" && ["active", "trialing"].includes(subscription.status) && !!subscription.current_period_end && new Date(subscription.current_period_end).getTime() > Date.now());

  if (!isPro) return <main className="mx-auto max-w-md px-3.5 py-5 pb-24 font-sans"><div className="flex items-center gap-3"><Link href={routes.extrovert} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#761f30]">EXTROVERT BEYOND</p><h1 className="text-xl font-black">Dating insights</h1></div></div><section className="mt-5 rounded-[2rem] border border-[#e5cbd0] bg-gradient-to-br from-[#f8e9ec] via-white to-[#f7efeb] p-7 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#761f30] shadow-sm"><BarChart3 className="h-7 w-7" /></div><h2 className="mt-4 text-2xl font-black">See how your dating is going.</h2><p className="mt-2 text-xs leading-5 text-zinc-500">Beyond turns your real likes, matches, passes, views and recent activity into useful profile insights.</p><Link href={routes.extrovert} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#761f30] px-5 py-3 text-xs font-black text-white"><Sparkles className="h-3.5 w-3.5" />Unlock Beyond</Link></section></main>;

  const [likesSent, likesReceived, passes, matches, views, recentLikes, recentMatches, recentViews] = await Promise.all([
    supabase.from("likes").select("id", { count: "exact", head: true }).eq("liker_id", user.id),
    supabase.from("likes").select("id", { count: "exact", head: true }).eq("liked_id", user.id),
    supabase.from("passes").select("id", { count: "exact", head: true }).eq("passer_id", user.id),
    supabase.from("matches").select("id", { count: "exact", head: true }).or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("viewed_id", user.id),
    supabase.from("likes").select("id", { count: "exact", head: true }).eq("liker_id", user.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from("matches").select("id", { count: "exact", head: true }).or(`user_a.eq.${user.id},user_b.eq.${user.id}`).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("viewed_id", user.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);
  const sent = likesSent.count ?? 0; const received = likesReceived.count ?? 0; const matchCount = matches.count ?? 0; const viewCount = views.count ?? 0;
  const matchRate = sent ? Math.round((matchCount / sent) * 100) : 0;
  const likeRate = viewCount ? Math.round((received / viewCount) * 100) : 0;

  return <main className="mx-auto max-w-2xl px-3.5 py-4 pb-28 font-sans sm:px-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Link href={routes.extrovert} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#761f30]">EXTROVERT BEYOND</p><h1 className="text-xl font-black">Dating insights</h1></div></div><BarChart3 className="h-6 w-6 text-[#761f30]" /></div><section className="mt-4 rounded-[2rem] border border-[#e5cbd0] bg-gradient-to-br from-[#f8e9ec] via-white to-[#f7efeb] p-5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#761f30]"><TrendingUp className="h-3.5 w-3.5" /> Your dating activity</div><h2 className="mt-2 text-2xl font-black">Your profile is getting attention.</h2><p className="mt-1 text-xs leading-5 text-zinc-500">These numbers are calculated from your actual Extrovert activity, not sample data.</p><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/80 p-3 text-center"><p className="text-xl font-black">{recentLikes.count ?? 0}</p><p className="text-[9px] font-bold text-zinc-500">Likes sent · 7d</p></div><div className="rounded-2xl bg-white/80 p-3 text-center"><p className="text-xl font-black">{recentMatches.count ?? 0}</p><p className="text-[9px] font-bold text-zinc-500">Matches · 7d</p></div><div className="rounded-2xl bg-white/80 p-3 text-center"><p className="text-xl font-black">{recentViews.count ?? 0}</p><p className="text-[9px] font-bold text-zinc-500">Views · 7d</p></div></div></section><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat icon={Heart} label="Likes sent" value={sent} detail="People you have liked." /><Stat icon={Users} label="Likes received" value={received} detail="People who liked you." /><Stat icon={Star} label="Matches" value={matchCount} detail="Mutual likes." /><Stat icon={Eye} label="Profile views" value={viewCount} detail="Visits to your profile." /></div><section className="mt-4 rounded-[2rem] border border-zinc-200 bg-white p-5"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#761f30]" /><h2 className="text-sm font-black">Your conversion signals</h2></div><div className="mt-4 space-y-3"><div><div className="flex items-center justify-between text-[10px] font-bold"><span>Like → match</span><span>{matchRate}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#761f30]" style={{ width: `${Math.min(matchRate, 100)}%` }} /></div></div><div><div className="flex items-center justify-between text-[10px] font-bold"><span>View → like</span><span>{likeRate}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#761f30]" style={{ width: `${Math.min(likeRate, 100)}%` }} /></div></div></div><p className="mt-4 text-[10px] leading-4 text-zinc-500">These are directional signals, not guarantees. Improving photos, bio and prompts can change how people respond.</p></section><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href={routes.likes} className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm"><Heart className="h-4 w-4 text-[#761f30]" /><p className="mt-2 text-xs font-black">See who liked you</p><p className="mt-1 text-[10px] text-zinc-500">Open your incoming likes.</p></Link><Link href={routes.profileViews} className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm"><Eye className="h-4 w-4 text-[#761f30]" /><p className="mt-2 text-xs font-black">See who viewed you</p><p className="mt-1 text-[10px] text-zinc-500">Open your profile viewers.</p></Link></div><div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-zinc-400"><Lock className="h-3 w-3" /> Premium insights use your real account activity</div></main>;
}

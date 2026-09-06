import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";

type Viewer = { viewer_id: string; viewed_at: string; display_name: string; date_of_birth: string; department: string; academic_year: string; profile_photos: { storage_path: string; is_primary: boolean; display_order: number }[] };
export const metadata: Metadata = { title: "Profile Views | DateBu" };
export const dynamic = "force-dynamic";
export default async function ProfileViewsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);
  const [{ data: isPro }, { count }] = await Promise.all([
    supabase.rpc("is_datebu_pro"),
    supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("viewed_id", user.id),
  ]);
  const totalViews = count ?? 0;
  if (!isPro) return <main className="mx-auto max-w-md px-3.5 py-4 pb-24 font-sans"><div className="flex items-center gap-3 px-1"><Link href={routes.app} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs active:scale-95"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Your audience</p><h1 className="text-xl font-black text-foreground">Profile views</h1></div></div><section className="mt-4 rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm"><Eye className="h-5 w-5" /></div><p className="mt-4 text-4xl font-black text-foreground">{totalViews}</p><p className="mt-1 text-xs font-bold text-muted-foreground">people have viewed your profile</p><div className="mx-auto mt-5 max-w-xs rounded-2xl border border-white/80 bg-white/70 p-4"><Lock className="mx-auto h-4 w-4 text-emerald-600" /><p className="mt-2 text-xs font-black text-foreground">See exactly who</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Extrovert unlocks the identities and profiles behind your views.</p></div><Link href={routes.extrovert} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white"><Sparkles className="h-3.5 w-3.5" />Unlock with Extrovert</Link></section></main>;
  const { data, error } = await supabase.rpc("get_profile_viewers", { p_limit: 100 });
  if (error) console.error("Failed to load profile viewers:", error);
  const viewers = (data ?? []) as Viewer[];
  return <main className="mx-auto max-w-md px-3.5 py-4 pb-24 font-sans"><div className="flex items-center gap-3 px-1"><Link href={routes.app} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs active:scale-95"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Extrovert insights</p><h1 className="text-xl font-black text-foreground">Profile views</h1></div></div><section className="mt-4 rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">People who checked you out</p><p className="mt-1 text-sm font-black text-emerald-950">{totalViews} total views</p></section><div className="mt-3 space-y-2">{viewers.map(view=>{const photo=[...(view.profile_photos??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.display_order-b.display_order)[0];const photoUrl=getProfilePhotoUrl(photo?.storage_path,160);const age=calculateAge(view.date_of_birth);return <Link key={view.viewer_id} href={`${routes.profileView}/${view.viewer_id}`} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 active:scale-[.99]"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">{photoUrl?<Image src={photoUrl} alt={view.display_name} fill className="object-cover" sizes="56px"/>:<div className="flex h-full items-center justify-center font-black text-emerald-700">{view.display_name?.charAt(0)??"?"}</div>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-sm font-black text-foreground">{view.display_name}{age!==null?`, ${age}`:""}</p><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600"/></div><p className="truncate text-[10px] text-muted-foreground">{view.department} · {view.academic_year}</p><p className="mt-1 text-[9px] font-semibold text-emerald-600">Viewed your profile</p></div></Link>})}{viewers.length===0&&<div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center"><Eye className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-black text-foreground">No profile views yet</p><p className="mt-1 text-xs text-muted-foreground">When students open your profile, their visits will appear here.</p></div>}</div></main>;
}

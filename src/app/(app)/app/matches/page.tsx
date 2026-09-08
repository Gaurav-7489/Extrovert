import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { RemoveMatchButton } from "@/components/matches/remove-match-button";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";
import { MessageCircle, Compass, ShieldCheck, MapPin, UserRound, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Your Matches | Extrovert" };
export const dynamic = "force-dynamic";

type MatchProfile = { id:string; display_name:string; date_of_birth:string; gender:string; department:string; academic_year:string; bio:string|null; campus_residency:string|null; relationship_goal:string|null; zodiac:string|null; profile_photos:Array<{storage_path:string;display_order:number;is_primary:boolean}>|null };
type IdentityStatus = { id:string; verification_status:string|null; area_verification_status:string|null };

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);
  const [{data:blocksCreated},{data:blocksReceived},{data:rawMatches,error:matchesError}] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id",user.id),
    supabase.from("blocks").select("blocker_id").eq("blocked_id",user.id),
    supabase.from("matches").select("id,user_a,user_b,created_at").or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order("created_at",{ascending:false}),
  ]);
  const blockedUserIds=new Set<string>([...(blocksCreated??[]).map(b=>b.blocked_id),...(blocksReceived??[]).map(b=>b.blocker_id)]);
  if(matchesError) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-bold text-[#F5F7FA]">Something went wrong</h1><p className="mt-2 text-xs text-[#9AA3B2]">We couldn&apos;t load your matches right now.</p></div>;
  const matches=(rawMatches??[]).filter(m=>!blockedUserIds.has(m.user_a===user.id?m.user_b:m.user_a));
  if(matches.length===0) return <div className="mx-auto max-w-md px-4 py-16"><EmptyState icon="💖" title="No matches yet" description="Keep swiping in Discover. When you and someone connect mutually, they will appear right here."><Link href={routes.discover}><Button variant="primary" size="md" className="gap-2"><Compass className="h-4 w-4"/>Start Swiping</Button></Link></EmptyState></div>;
  const otherUserIds=matches.map(m=>m.user_a===user.id?m.user_b:m.user_a);
  const [{data:profiles,error:profilesError},{data:identities}]=await Promise.all([supabase.rpc("get_match_profiles",{p_user_ids:otherUserIds}),createAdminClient().from("extrovert_profiles").select("id,verification_status,area_verification_status").in("id",otherUserIds)]);
  if(profilesError) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-bold text-[#F5F7FA]">Something went wrong</h1><p className="mt-2 text-xs text-[#9AA3B2]">We found your matches, but couldn&apos;t load their profiles. Please try again.</p></div>;
  const profileMap=new Map(((profiles??[]) as MatchProfile[]).map(p=>[p.id,p]));
  const identityMap=new Map(((identities??[]) as IdentityStatus[]).map(p=>[p.id,p]));
  return <main className="mx-auto w-full max-w-md px-3.5 pb-24 pt-4 font-sans sm:px-4">
    <header className="mb-5 flex items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#E04A4A]">CONNECTIONS</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#F5F7FA]">Your Matches</h1><p className="mt-1 text-xs font-medium text-[#9AA3B2]">{matches.length} connection{matches.length===1?"":"s"} made</p></div><Link href={routes.discover} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#E04A4A]/25 bg-[#32181B] px-3 text-[11px] font-bold text-[#F5F7FA] transition hover:border-[#E04A4A]/45 hover:bg-[#3d1b1f] active:scale-[.98]"><Sparkles className="h-3.5 w-3.5 text-[#E04A4A]"/>Keep Swiping</Link></header>
    <div className="grid grid-cols-2 gap-3">{matches.map((match,idx)=>{const otherUserId=match.user_a===user.id?match.user_b:match.user_a;const profile=profileMap.get(otherUserId);if(!profile)return null;const identity=identityMap.get(otherUserId);const photos=[...(profile.profile_photos??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.display_order-b.display_order);const photoUrl=getProfilePhotoUrl(photos[0]?.storage_path,320);const age=calculateAge(profile.date_of_birth);return <article key={match.id} className="group overflow-hidden rounded-[1.5rem] border border-[#272C35] bg-[#111318] shadow-[0_12px_34px_rgba(0,0,0,.18)] transition hover:border-[#E04A4A]/25"><Link href={`${routes.profileView}/${otherUserId}`} className="relative block aspect-[4/5] overflow-hidden bg-[#181B21]">{photoUrl?<Image src={photoUrl} alt={profile.display_name??"Member"} fill priority={idx<4} decoding="async" className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:640px) 50vw, 200px"/>:<div className="flex h-full w-full items-center justify-center bg-[#32181B] text-2xl font-bold text-[#E04A4A]">{profile.display_name?.charAt(0)??"?"}</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent"/><div className="absolute left-2.5 right-2.5 top-2.5 flex justify-end gap-1">{identity?.verification_status==="verified"&&<span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-md"><ShieldCheck className="h-2.5 w-2.5 text-[#E04A4A]"/>Verified</span>}{identity?.area_verification_status==="verified"&&<span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-md"><MapPin className="h-2.5 w-2.5 text-[#9AA3B2]"/>Area</span>}</div><div className="absolute bottom-3 left-3 right-3 text-white"><h2 className="truncate text-sm font-bold leading-tight">{profile.display_name||"Member"}{age!==null&&<span className="ml-1 text-xs font-medium text-white/75">{age}</span>}</h2><p className="mt-1 truncate text-[10px] font-medium text-white/65">{profile.department?.split("&")[0]?.trim()}{profile.academic_year?` · ${profile.academic_year}`:""}</p>{profile.campus_residency&&<span className="mt-1 inline-flex items-center gap-1 text-[9px] text-white/60"><MapPin className="h-2.5 w-2.5"/>{profile.campus_residency}</span>}</div></Link><div className="grid grid-cols-3 gap-1.5 border-t border-[#272C35] p-2"><Link href={`${routes.profileView}/${otherUserId}`} className="flex min-h-9 items-center justify-center gap-1 rounded-xl border border-[#272C35] bg-[#181B21] text-[10px] font-semibold text-[#D3D8E1] transition hover:bg-[#20242b] active:scale-[.98]"><UserRound className="h-3.5 w-3.5"/>Profile</Link><Link href={`${routes.messages}/${match.id}`} className="flex min-h-9 items-center justify-center gap-1 rounded-xl bg-[#E04A4A] text-[10px] font-bold text-white shadow-[0_6px_18px_rgba(224,74,74,.16)] transition hover:bg-[#d43f3f] active:scale-[.98]"><MessageCircle className="h-3.5 w-3.5"/>Chat</Link><RemoveMatchButton matchId={match.id}/></div></article>})}</div>
  </main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import DiscoverClient from "./discover-client";
import { Sparkles, ArrowRight } from "lucide-react";
export const metadata: Metadata = { title: "Dating | Extrovert" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
const DISCOVER_BATCH_SIZE = 20;
const DISCOVER_CANDIDATE_SIZE = 50;
const VERIFIED_REACH_BOOST = 0.35;
const DISCOVER_IMAGE_WIDTH = 768;
type DiscoverProfile = { id:string;display_name:string;date_of_birth:string;gender:string;department:string;academic_year:string;identity_type?:string;institution_name?:string|null;field_of_study?:string|null;job_title?:string|null;employer_name?:string|null;role_description?:string|null;bio:string|null;ghost_mode:boolean;created_at:string;profile_photos:Array<{storage_path:string;display_order:number;is_primary:boolean}>|null;profile_interests:Array<{interests:{id:string;name:string}|null}>|null };
type TrustRow = { id:string;verification_status:string;area_verification_status:string;area_id:string|null;profile_photo_path:string|null;trust_state:string };
export default async function DiscoverPage(){
 const supabase=await createServerSupabaseClient();
 const {data:claimsData}=await supabase.auth.getClaims();
 const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
 if(!userId)return null;
 const [{data:myProfile},{data:myPrefs},{data:likes},{data:passes},{data:blocksCreated},{data:blocksReceived},{data:isPro}]=await Promise.all([
  supabase.from("profiles").select("id,profile_completed,ghost_mode").eq("id",userId).maybeSingle(),
  supabase.from("dating_preferences").select("preferred_department,interested_in").eq("user_id",userId).maybeSingle(),
  supabase.from("likes").select("liked_id").eq("liker_id",userId),
  supabase.from("passes").select("passed_id").eq("passer_id",userId),
  supabase.from("blocks").select("blocked_id").eq("blocker_id",userId),
  supabase.from("blocks").select("blocker_id").eq("blocked_id",userId),
  supabase.rpc("is_datebu_pro"),
 ]);
 if(!myProfile?.profile_completed)return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Card className="border-emerald-100 bg-emerald-50/50 p-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Sparkles className="h-7 w-7"/></div><h1 className="mt-4 text-2xl font-black">Finish your dating profile first</h1><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Complete your dating profile when you want to appear in Dating. You can still use Social for the social side of Extrovert.</p><Link href={routes.profileSetup}><Button className="mt-4 gap-2 bg-emerald-600 text-white hover:bg-emerald-700">Set up dating <ArrowRight className="h-4 w-4"/></Button></Link></Card></div>;
 const excludedIds=new Set<string>([userId,...(likes??[]).map(l=>l.liked_id),...(passes??[]).map(p=>p.passed_id),...(blocksCreated??[]).map(b=>b.blocked_id),...(blocksReceived??[]).map(b=>b.blocker_id)]);
 const {data:rawProfiles,error}=await supabase.rpc("get_discover_profiles",{p_excluded_ids:Array.from(excludedIds),p_limit:DISCOVER_CANDIDATE_SIZE});
 if(error)return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-bold">Dating is taking a moment</h1><p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load people right now. Please try again.</p></div>;
 let normalized=(rawProfiles??[]) as DiscoverProfile[];
 const wanted=Array.isArray(myPrefs?.interested_in)?myPrefs.interested_in:[];
 if(!wanted.includes("everyone")&&wanted.length){normalized=normalized.filter(p=>{const g=(p.gender||"").toLowerCase();if(wanted.includes("men")&&(g==="man"||g==="male"))return true;if(wanted.includes("women")&&(g==="woman"||g==="female"))return true;if((wanted.includes("nonbinary")||wanted.includes("other"))&&(g==="non-binary"||g==="nonbinary"||g==="other"))return true;return false;});}
 const prefDept=myPrefs?.preferred_department?.trim().toLowerCase();
 if(prefDept)normalized.sort((a,b)=>Number(b.department?.toLowerCase().includes(prefDept))-Number(a.department?.toLowerCase().includes(prefDept)));
 const candidateIds=normalized.map(p=>p.id);
 const [{data:paidRows},{data:trustRows}]=await Promise.all([
  candidateIds.length?supabase.from("subscriptions").select("user_id,plan,status,current_period_end,trial_ends_at").in("user_id",candidateIds).eq("plan","pro").in("status",["active","trialing"]):Promise.resolve({data:[]}),
  candidateIds.length?supabase.from("extrovert_profiles").select("id,verification_status,area_verification_status,area_id,profile_photo_path,trust_state").in("id",candidateIds):Promise.resolve({data:[]}),
 ]);
 const paidBeyondIds=new Set((paidRows??[]).filter(s=>s.status==="trialing"?!!s.trial_ends_at&&new Date(s.trial_ends_at).getTime()>Date.now():!!s.current_period_end&&new Date(s.current_period_end).getTime()>Date.now()).map(s=>s.user_id));
 const womanIds=new Set(normalized.filter(p=>["woman","female"].includes((p.gender||"").toLowerCase())).map(p=>p.id));
 const beyondIds=new Set([...paidBeyondIds,...womanIds]);
 const trustMap=new Map(((trustRows??[]) as TrustRow[]).map(row=>[row.id,row]));
 const areaIds=Array.from(new Set((trustRows??[]).map(row=>row.area_id).filter(Boolean))) as string[];
 const {data:areaRows}=areaIds.length?await supabase.from("extrovert_areas").select("id,name").in("id",areaIds):{data:[]};
 const areaMap=new Map((areaRows??[]).map(a=>[a.id,a.name]));
 const ranked=normalized.map((profile,index)=>{const trust=trustMap.get(profile.id);const verified=trust?.verification_status==="verified";const areaVerified=trust?.area_verification_status==="verified";const trustBoost=(verified?VERIFIED_REACH_BOOST:0)+(areaVerified?VERIFIED_REACH_BOOST/2:0);return{profile,index,score:index-trustBoost-(beyondIds.has(profile.id)?0.15:0)}}).sort((a,b)=>a.score-b.score).slice(0,DISCOVER_BATCH_SIZE).map(item=>item.profile);
 const profilesWithPhotoUrls=ranked.map(profile=>{const trust=trustMap.get(profile.id);const photos=[...(profile.profile_photos??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.display_order-b.display_order).slice(0,5).map(photo=>({...photo,url:getProfilePhotoUrl(photo.storage_path,DISCOVER_IMAGE_WIDTH)}));const sharedPhoto=getProfilePhotoUrl(trust?.profile_photo_path,DISCOVER_IMAGE_WIDTH);const context=profile.job_title||profile.field_of_study||profile.department||(profile.identity_type==="student"?"Student":profile.identity_type==="professional"?"Professional":"Extrovert member");const identityVerified=trust?.verification_status==="verified";const areaVerified=trust?.area_verification_status==="verified";return{...profile,profile_photo_url:photos[0]?.url??sharedPhoto,profile_photos:photos,verification_status:trust?.verification_status??"not_verified",area_verification_status:trust?.area_verification_status??"not_verified",area_name:trust?.area_id?areaMap.get(trust.area_id)??null:null,bio:profile.bio??null,identity_context:context,identity_verified:identityVerified,area_verified:areaVerified};});
 return <DiscoverClient profiles={profilesWithPhotoUrls} isPro={Boolean(isPro)}/>;
}

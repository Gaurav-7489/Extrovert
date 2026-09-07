import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import DiscoverMode from "./discover-mode";
import { Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Dating | Extrovert" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DISCOVER_BATCH_SIZE = 20;
const DISCOVER_CANDIDATE_SIZE = 50;
const DISCOVER_IMAGE_WIDTH = 768;

type DiscoverProfile = {
  id:string;display_name:string;date_of_birth:string;gender:string;department:string;academic_year:string;
  identity_type?:string;institution_name?:string|null;field_of_study?:string|null;job_title?:string|null;
  employer_name?:string|null;role_description?:string|null;bio:string|null;ghost_mode:boolean;created_at:string;
  profile_photos:Array<{storage_path:string;display_order:number;is_primary:boolean}>|null;
  profile_interests:Array<{interests:{id:string;name:string}|null}>|null;
  verification_status:string;area_verification_status:string;area_name:string|null;profile_photo_path:string|null;is_beyond:boolean;
};

export default async function DiscoverPage(){
  const supabase=await createServerSupabaseClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
  if(!userId)return null;

  // The dating form only marks profiles.profile_completed=true after it has
  // successfully validated and saved the required photo, interests and age
  // preferences. Keep that flag as the primary completion signal, while also
  // supporting older rows whose flag was never set correctly.
  const [{data:myProfile},{data:myPrefs},{data:isPro},{data:myPhotos},{data:myInterests}]=await Promise.all([
    supabase.from("profiles").select("id,profile_completed,display_name,date_of_birth,gender,department,academic_year,area_name,bio").eq("id",userId).maybeSingle(),
    supabase.from("dating_preferences").select("preferred_department,interested_in,min_age,max_age").eq("user_id",userId).maybeSingle(),
    supabase.rpc("is_datebu_pro"),
    supabase.from("profile_photos").select("id").eq("profile_id",userId).limit(1),
    supabase.from("profile_interests").select("interest_id").eq("profile_id",userId).limit(1),
  ]);

  const actualDatingDataComplete=Boolean(
    myProfile?.display_name?.trim() &&
    myProfile?.date_of_birth &&
    myProfile?.gender &&
    (myPhotos?.length??0)>0 &&
    (myInterests?.length??0)>0 &&
    Array.isArray(myPrefs?.interested_in) && myPrefs.interested_in.length>0 &&
    Number.isInteger(myPrefs?.min_age) && Number.isInteger(myPrefs?.max_age)
  );

  const hasDatingProfile=Boolean(myProfile?.profile_completed || actualDatingDataComplete);

  if(!hasDatingProfile)return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Card className="border-emerald-100 bg-emerald-50/50 p-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Sparkles className="h-7 w-7"/></div><h1 className="mt-4 text-2xl font-black">Finish your dating profile first</h1><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Complete your dating profile when you want to appear in Dating. You can still use Social for the social side of Extrovert.</p><Link href={routes.profileSetup}><Button className="mt-4 gap-2 bg-emerald-600 text-white hover:bg-emerald-700">Set up dating <ArrowRight className="h-4 w-4"/></Button></Link></Card></div>;

  const wanted=Array.isArray(myPrefs?.interested_in)?myPrefs.interested_in:[];
  const prefDept=myPrefs?.preferred_department?.trim()||null;
  const {data:rawProfiles,error}=await supabase.rpc("get_discover_profiles_v2",{
    p_excluded_ids:[userId],p_limit:DISCOVER_CANDIDATE_SIZE,p_interested_in:wanted,p_preferred_department:prefDept,
  });
  if(error)return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-bold">Dating is taking a moment</h1><p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load people right now. Please try again.</p></div>;

  const normalized=(rawProfiles??[]) as DiscoverProfile[];
  const ranked=normalized.slice(0,DISCOVER_BATCH_SIZE);
  const profilesWithPhotoUrls=ranked.map(profile=>{
    const photos=[...(profile.profile_photos??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.display_order-b.display_order).slice(0,5).map(photo=>({...photo,url:getProfilePhotoUrl(photo.storage_path,DISCOVER_IMAGE_WIDTH)}));
    const sharedPhoto=getProfilePhotoUrl(profile.profile_photo_path,DISCOVER_IMAGE_WIDTH);
    const context=profile.job_title||profile.field_of_study||profile.department||(profile.identity_type==="student"?"Student":profile.identity_type==="professional"?"Professional":"Extrovert member");
    return{...profile,profile_photo_url:photos[0]?.url??sharedPhoto,profile_photos:photos,verification_status:profile.verification_status,area_verification_status:profile.area_verification_status,area_name:profile.area_name,bio:profile.bio??null,identity_context:context};
  });

  const nearbyArea=myProfile?.area_name??null;
  return <DiscoverMode profiles={profilesWithPhotoUrls} isPro={Boolean(isPro)} nearbyArea={nearbyArea}/>;
}

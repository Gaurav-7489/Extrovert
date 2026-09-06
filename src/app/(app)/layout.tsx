import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { AppNavbar } from "@/components/layout/app-navbar";
import { DatingBottomNav } from "@/components/layout/dating-bottom-nav";
import { MessageKeyBootstrap } from "@/components/security/message-key-bootstrap";
import { LazyGlobalFeatures } from "@/components/layout/lazy-global-features";
import { isSuperAdminUser } from "@/types/roles";

export default async function AppLayout({children}:{children:React.ReactNode}){
 const supabase=await createServerSupabaseClient();
 const {data:claimsData}=await supabase.auth.getClaims();
 const claims=claimsData?.claims;
 const userId=typeof claims?.sub==="string"?claims.sub:null;
 const userEmail=typeof claims?.email==="string"?claims.email:"Unknown";
 if(!userId)redirect(routes.login);
 // Keep the critical gate to two tiny indexed reads. Everything else belongs
 // to the destination page and must never block the shared app shell.
 const [{data:extrovertProfile},{data:profile}]=await Promise.all([
   supabase.from("extrovert_profiles").select("profile_completed,trust_state").eq("id",userId).maybeSingle(),
   supabase.from("profiles").select("role").eq("id",userId).maybeSingle(),
 ]);
 if(!extrovertProfile?.profile_completed)redirect(routes.onboarding);
 if(extrovertProfile.trust_state==="banned")redirect(routes.login);
 const userRole=(profile?.role??"").toUpperCase();
 const ownerId=process.env.DATEBU_OWNER_ID?.trim();
 const adminEmails=(process.env.SUPER_ADMIN_EMAILS??"").split(",").map((email)=>email.trim().toLowerCase()).filter(Boolean);
 const isSuperAdmin=isSuperAdminUser(userId)||userRole==="SUPER_ADMIN"||userRole==="ADMIN"||(Boolean(ownerId)&&userId===ownerId)||(userEmail!=="Unknown"&&adminEmails.includes(userEmail.toLowerCase()));
 return <div className="flex h-[100dvh] flex-col overflow-hidden bg-white overscroll-none select-none text-zinc-950"><AppNavbar userEmail={userEmail} isSuperAdmin={isSuperAdmin}/><main className="min-h-0 flex-1 overflow-y-auto pb-[76px] md:pb-0">{children}</main><DatingBottomNav/><LazyGlobalFeatures/><MessageKeyBootstrap userId={userId}/></div>;
}

import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { AppNavbar } from "@/components/layout/app-navbar";
import { DatingBottomNav } from "@/components/layout/dating-bottom-nav";
import { MessageKeyBootstrap } from "@/components/security/message-key-bootstrap";
import { isSuperAdminUser } from "@/types/roles";

const InteractionFeedback = dynamicImport(() => import("@/components/ui/interaction-feedback").then((mod) => mod.InteractionFeedback), { ssr: false });
const WomenWelcome = dynamicImport(() => import("@/components/women-welcome").then((mod) => mod.WomenWelcome), { ssr: false });
const PushNotifications = dynamicImport(() => import("@/components/notifications/push-notifications").then((mod) => mod.PushNotifications), { ssr: false });
const MatchCelebration = dynamicImport(() => import("@/components/notifications/match-celebration").then((mod) => mod.MatchCelebration), { ssr: false });
const AppInstallPrompt = dynamicImport(() => import("@/components/install/app-install-prompt").then((mod) => mod.AppInstallPrompt), { ssr: false });

export const dynamic = "force-dynamic";
export default async function AppLayout({children}:{children:React.ReactNode}){
 const supabase=await createServerSupabaseClient(); const {data:claimsData}=await supabase.auth.getClaims();
 const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null; const userEmail=typeof claimsData?.claims?.email==="string"?claimsData.claims.email:"Unknown";
 if(!userId)redirect(routes.login);
 const [{data:extrovertProfile},{data:profile}]=await Promise.all([supabase.from("extrovert_profiles").select("profile_completed,trust_state").eq("id",userId).maybeSingle(),supabase.from("profiles").select("role").eq("id",userId).maybeSingle()]);
 if(!extrovertProfile?.profile_completed)redirect(routes.onboarding); if(extrovertProfile.trust_state==="banned")redirect(routes.login);
 const userRole=(profile?.role??"").toUpperCase(); const ownerId=process.env.DATEBU_OWNER_ID?.trim(); const adminEmails=(process.env.SUPER_ADMIN_EMAILS??"").split(",").map((email)=>email.trim().toLowerCase()).filter(Boolean);
 const isSuperAdmin=isSuperAdminUser(userId)||userRole==="SUPER_ADMIN"||userRole==="ADMIN"||(Boolean(ownerId)&&userId===ownerId)||(userEmail!=="Unknown"&&adminEmails.includes(userEmail.toLowerCase()));
 return <div className="flex h-[100dvh] flex-col overflow-hidden bg-white overscroll-none select-none text-zinc-950"><AppNavbar userEmail={userEmail} isSuperAdmin={isSuperAdmin}/><main className="min-h-0 flex-1 overflow-y-auto pb-[76px] md:pb-0">{children}</main><DatingBottomNav/><InteractionFeedback/><WomenWelcome/><PushNotifications/><MatchCelebration/><AppInstallPrompt/><MessageKeyBootstrap userId={userId}/></div>;
}

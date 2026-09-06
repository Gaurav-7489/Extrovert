import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routes } from "@/config/routes";
import { ADMIN_ROLES, isSuperAdminUser } from "@/types/roles";

export async function updateSession(request: NextRequest) {
  const pathname=request.nextUrl.pathname;
  const isAuthRoute=pathname===routes.login||pathname===routes.register;
  const isOnboardingRoute=pathname===routes.onboarding;
  const isAppRoute=pathname===routes.app||pathname.startsWith("/app/");
  const isAdminRoute=pathname===routes.admin.root||pathname.startsWith("/admin/");
  const isFaceVerifyRoute=pathname===routes.verifyFace;
  let supabaseResponse=NextResponse.next({request});
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return request.cookies.getAll()},setAll(cookiesToSet:{name:string;value:string;options?:Record<string,unknown>}[]){cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));supabaseResponse=NextResponse.next({request});cookiesToSet.forEach(({name,value,options})=>supabaseResponse.cookies.set(name,value,options))}}});

  let userId:string|null=null;
  try {
    const {data:claimsData}=await supabase.auth.getClaims();
    userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
  } catch {
    // A revoked/expired refresh token should become a clean signed-out state,
    // not a repeated middleware error on every request.
    for(const cookie of request.cookies.getAll()){
      if(cookie.name.startsWith("sb-")&&cookie.name.includes("auth-token"))supabaseResponse.cookies.delete(cookie.name);
    }
    userId=null;
  }

  if(!userId&&(isAppRoute||isAdminRoute||isFaceVerifyRoute||isOnboardingRoute))return NextResponse.redirect(new URL(routes.login,request.url));
  if(!userId)return supabaseResponse;
  const {data:extrovertProfile}=await supabase.from("extrovert_profiles").select("profile_completed,trust_state").eq("id",userId).maybeSingle();
  if(extrovertProfile?.trust_state==="banned")return NextResponse.redirect(new URL(routes.login,request.url));
  if(!extrovertProfile?.profile_completed&&!isOnboardingRoute)return NextResponse.redirect(new URL(routes.onboarding,request.url));
  if(isOnboardingRoute)return supabaseResponse;
  if(isAdminRoute){const {data:profile}=await supabase.from("profiles").select("role").eq("id",userId).maybeSingle();const hasAdminAccess=isSuperAdminUser(userId)||Boolean(profile?.role&&ADMIN_ROLES.includes(profile.role));if(!hasAdminAccess)return NextResponse.redirect(new URL(routes.app,request.url));}
  if(isAuthRoute)return NextResponse.redirect(new URL(routes.app,request.url));
  return supabaseResponse;
}

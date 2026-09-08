"use server";
import {revalidatePath} from "next/cache";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {routes} from "@/config/routes";
import {isUuid} from "@/lib/validation";
export type RemoveMatchResult={error:string|null;success?:boolean};
export async function removeMatch(targetUserId:string):Promise<RemoveMatchResult>{if(!isUuid(targetUserId))return{error:"Invalid profile."};const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{error:"You must be logged in."};if(user.id===targetUserId)return{error:"Invalid match."};const[userA,userB]=user.id<targetUserId?[user.id,targetUserId]:[targetUserId,user.id];const{data:match}=await supabase.from("matches").select("id").eq("user_a",userA).eq("user_b",userB).maybeSingle();if(!match)return{error:"This match is already gone."};const{error:matchError}=await supabase.from("matches").delete().eq("id",match.id).eq("user_a",userA).eq("user_b",userB);if(matchError)return{error:"Couldn't remove this match. Please try again."};await supabase.from("likes").delete().eq("liker_id",user.id).eq("liked_id",targetUserId);await supabase.from("likes").delete().eq("liker_id",targetUserId).eq("liked_id",user.id);revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);return{error:null,success:true};}
export async function unlikeProfile(targetUserId:string):Promise<RemoveMatchResult>{if(!isUuid(targetUserId))return{error:"Invalid profile."};const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{error:"You must be logged in."};if(user.id===targetUserId)return{error:"Invalid profile."};const{data,error}=await supabase.rpc("unlike_profile",{p_profile_id:targetUserId});if(error){const message=error.message||"Couldn't remove your Like.";if(message.includes("AUTH_REQUIRED"))return{error:"You must be logged in."};return{error:"Couldn't remove your Like. Please try again."};}if(data===false)return{error:"That Like is already removed."};revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);revalidatePath(routes.discover);return{error:null,success:true};}
export async function likeBack(targetUserId:string):Promise<{error:string|null;matched?:boolean;matchId?:string}>{
  if(!isUuid(targetUserId))return{error:"Invalid profile."};
  const supabase=await createServerSupabaseClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return{error:"You must be logged in."};
  if(user.id===targetUserId)return{error:"Invalid profile."};
  const{error:insertError}=await supabase.from("likes").upsert({liker_id:user.id,liked_id:targetUserId},{onConflict:"liker_id,liked_id",ignoreDuplicates:true});
  if(insertError)return{error:"Couldn't Like back. Please try again."};
  const[userA,userB]=user.id<targetUserId?[user.id,targetUserId]:[targetUserId,user.id];
  const{data:reciprocal}=await supabase.from("likes").select("id").eq("liker_id",targetUserId).eq("liked_id",user.id).maybeSingle();
  if(!reciprocal){revalidatePath(routes.likes);revalidatePath(routes.discover);return{error:null,matched:false};}
  const{data:match,error:matchError}=await supabase.from("matches").upsert({user_a:userA,user_b:userB},{onConflict:"user_a,user_b",ignoreDuplicates:true}).select("id").maybeSingle();
  if(matchError){
    const{data:existing}=await supabase.from("matches").select("id").eq("user_a",userA).eq("user_b",userB).maybeSingle();
    if(!existing)return{error:"Like sent, but we couldn't create the match yet."};
    revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);
    return{error:null,matched:true,matchId:existing.id};
  }
  revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);revalidatePath(routes.discover);
  return{error:null,matched:true,matchId:match?.id??undefined};
}

"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { isUuid } from "@/lib/validation";
export type RemoveMatchResult={error:string|null;success?:boolean};
export async function removeMatch(targetUserId:string):Promise<RemoveMatchResult>{if(!isUuid(targetUserId))return{error:"Invalid profile."};const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{error:"You must be logged in."};if(user.id===targetUserId)return{error:"Invalid match."};const[userA,userB]=user.id<targetUserId?[user.id,targetUserId]:[targetUserId,user.id];const{data:match}=await supabase.from("matches").select("id").eq("user_a",userA).eq("user_b",userB).maybeSingle();if(!match)return{error:"This match is already gone."};const{error:matchError}=await supabase.from("matches").delete().eq("id",match.id).eq("user_a",userA).eq("user_b",userB);if(matchError)return{error:"Couldn't remove this match. Please try again."};await supabase.from("likes").delete().eq("liker_id",user.id).eq("liked_id",targetUserId);await supabase.from("likes").delete().eq("liker_id",targetUserId).eq("liked_id",user.id);revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);return{error:null,success:true};}
export async function unlikeProfile(targetUserId:string):Promise<RemoveMatchResult>{if(!isUuid(targetUserId))return{error:"Invalid profile."};const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{error:"You must be logged in."};if(user.id===targetUserId)return{error:"Invalid profile."};const{data,error}=await supabase.rpc("unlike_profile",{p_profile_id:targetUserId});if(error){const message=error.message||"Couldn't remove your Like.";if(message.includes("AUTH_REQUIRED"))return{error:"You must be logged in."};return{error:"Couldn't remove your Like. Please try again."};}if(data===false)return{error:"That Like is already removed."};revalidatePath(routes.likes);revalidatePath(routes.matches);revalidatePath(routes.messages);revalidatePath(routes.discover);return{error:null,success:true};}
export async function likeBack(targetUserId:string):Promise<{error:string|null;matched?:boolean;matchId?:string}>{
 if(!isUuid(targetUserId))return{error:"Invalid profile."};
 const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();
 if(!user)return{error:"You must be logged in."};if(user.id===targetUserId)return{error:"Invalid profile."};
 const{data:result,error}=await supabase.rpc("like_profile",{p_profile_id:targetUserId});
 if(error){const m=error.message||"Couldn't save your Like.";if(m.includes("PROFILE_UNAVAILABLE"))return{error:"That profile is no longer available."};if(m.includes("USER_UNAVAILABLE"))return{error:"This user is unavailable."};if(m.includes("AUTH_REQUIRED"))return{error:"You must be logged in."};if(m.includes("LIKE_LIMIT_REACHED"))return{error:"You're out of Likes for now. Unlock Beyond or get more Likes."};return{error:"Couldn't save your Like. Please try again."};}
 const row=Array.isArray(result)?result[0]:result;const matched=Boolean(row?.matched);const matchId=row?.match_id??undefined;
 revalidatePath(routes.likes);revalidatePath(routes.discover);if(matched&&matchId){revalidatePath(routes.matches);revalidatePath(routes.messages);}
 return{error:null,matched,matchId};
}

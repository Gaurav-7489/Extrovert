import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import SocialChatLoader from "./social-chat-loader";
export const metadata: Metadata = { title: "Social Chat | Extrovert" };
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ conversationId: string }> };
type Message = { id: string; sender_id: string; ciphertext: string; created_at: string; read_at?: string | null };
type Profile = { id: string; display_name: string | null; department: string | null; profile_photo_path: string | null; verification_status: string | null; area_verification_status: string | null };
export default async function SocialChatPage({ params }: Props) {
  const { conversationId } = await params; const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect(routes.login);
  const { data: conversation } = await supabase.from("extrovert_conversations").select("id,connection_id").eq("id", conversationId).maybeSingle(); if (!conversation) notFound();
  const { data: membership } = await supabase.from("extrovert_conversation_members").select("conversation_id").eq("conversation_id", conversationId).eq("user_id", user.id).maybeSingle(); if (!membership) notFound();
  const { data: connection } = await supabase.from("extrovert_connections").select("id,requester_id,target_id,status").eq("id", conversation.connection_id).eq("status", "accepted").maybeSingle(); if (!connection || (connection.requester_id !== user.id && connection.target_id !== user.id)) notFound();
  const otherUserId = connection.requester_id === user.id ? connection.target_id : connection.requester_id;
  const [{ data: profile }, { data: messages }] = await Promise.all([supabase.from("extrovert_profiles").select("id,display_name,department,profile_photo_path,verification_status,area_verification_status").eq("id", otherUserId).maybeSingle(),supabase.from("extrovert_messages").select("id,sender_id,ciphertext,created_at,read_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(100)]);
  if (!profile) notFound(); const photoUrl = getProfilePhotoUrl(profile.profile_photo_path, 160); const typedProfile = profile as Profile; const initialMessages = [...(messages ?? [])].reverse() as Message[];
  return <main className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col overflow-hidden px-2 pb-0 font-sans md:px-4"><header className="z-20 flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/95 px-1 py-2.5 backdrop-blur-md"><Link href={routes.messages} aria-label="Back to messages" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white"><ArrowLeft className="h-4 w-4" /></Link><Link href={`${routes.profileView}/${otherUserId}`} className="flex min-w-0 flex-1 items-center gap-2.5"><div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-emerald-400/60 bg-zinc-100">{photoUrl?<Image src={photoUrl} alt={typedProfile.display_name??"Person"} fill priority sizes="36px" className="object-cover"/>:<div className="flex h-full w-full items-center justify-center bg-emerald-600 text-xs font-bold text-white">{typedProfile.display_name?.charAt(0)??"?"}</div>}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><h1 className="truncate text-sm font-black text-zinc-950">{typedProfile.display_name??"Connection"}</h1>{typedProfile.verification_status==="verified"&&<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600"/>}</div><p className="truncate text-[10px] text-zinc-500">{typedProfile.department??"Extrovert connection"}</p></div></Link><div className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 sm:flex"><LockKeyhole className="h-3 w-3"/>Secure</div></header><SocialChatLoader conversationId={conversationId} currentUserId={user.id} otherUserId={otherUserId} initialMessages={initialMessages}/></main>;
}

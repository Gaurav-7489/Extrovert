"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { isUuid } from "@/lib/validation";

export async function requestSocialConnection(targetId: string) {
  if (!isUuid(targetId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };
  if (user.id === targetId) return { error: "You cannot connect with yourself." };

  const { data: existing } = await supabase
    .from("extrovert_connections")
    .select("id,status,requester_id,target_id")
    .or(`and(requester_id.eq.${user.id},target_id.eq.${targetId}),and(requester_id.eq.${targetId},target_id.eq.${user.id})`)
    .maybeSingle();

  if (existing?.status === "accepted") return { error: "Already connected." };
  if (existing?.status === "pending") return { error: existing.requester_id === user.id ? "Request already sent." : "This person has already requested you. Open your requests to accept it." };

  if (existing && existing.requester_id !== user.id) return { error: "This connection is no longer available. The original requester can send a new request." };

  const payload = { requester_id: user.id, target_id: targetId, status: "pending" };
  const result = existing
    ? await supabase.from("extrovert_connections").update(payload).eq("id", existing.id)
    : await supabase.from("extrovert_connections").insert(payload);
  if (result.error) return { error: "Could not send connection request." };

  revalidatePath(routes.social);
  return { error: null, success: true };
}

export async function acceptSocialConnection(connectionId: string) {
  if (!isUuid(connectionId)) return { error: "Invalid connection." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const { data: connection } = await supabase
    .from("extrovert_connections")
    .select("id,requester_id,target_id,status")
    .eq("id", connectionId)
    .eq("target_id", user.id)
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  if (!connection) return { error: "Connection request not found." };

  const { error } = connection.status === "accepted" ? { error: null } : await supabase.from("extrovert_connections").update({ status: "accepted" }).eq("id", connectionId).eq("target_id", user.id).eq("status", "pending");
  if (error) return { error: "Could not accept connection." };

  const { data: conversationId, error: conversationError } = await supabase.rpc("get_or_create_extrovert_conversation", { p_connection_id: connectionId });
  if (conversationError || !conversationId) return { error: "Connection accepted, but chat could not be opened yet." };

  revalidatePath(routes.social);
  revalidatePath(routes.messages);
  return { error: null, success: true, conversationId };
}

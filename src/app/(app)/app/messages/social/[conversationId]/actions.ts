"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

const MAX_MESSAGE_LENGTH = 2000;

export async function sendSocialMessage(conversationId: string, ciphertext: string) {
  if (!isUuid(conversationId) || typeof ciphertext !== "string" || !ciphertext.trim()) {
    return { error: "Invalid message." };
  }
  if (ciphertext.length > MAX_MESSAGE_LENGTH * 8) return { error: "Message is too large." };

  if (!ciphertext.startsWith("v1.")) return { error: "Secure message encryption is required." };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const { data: membership } = await supabase
    .from("extrovert_conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "You are not a member of this conversation." };

  const { data, error } = await supabase
    .from("extrovert_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, ciphertext: ciphertext.trim() })
    .select("id,sender_id,ciphertext,created_at,read_at")
    .single();

  if (error) return { error: "Could not send message." };
  return { error: null, message: data };
}

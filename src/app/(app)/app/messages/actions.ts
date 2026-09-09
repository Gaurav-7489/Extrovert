"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { isUuid } from "@/lib/validation";
import { sendPushToUser } from "@/lib/push/server";

export type SendMessageResult = { error: string | null; message?: { id: string; sender_id: string; content: string | null; ciphertext: string | null; encryption_version: number; created_at: string } };
export type OlderMessagesResult = { error: string | null; messages: Array<{ id: string; sender_id: string; content: string | null; ciphertext: string | null; encryption_version: number; created_at: string }>; hasMore: boolean };

export async function loadOlderMessages(matchId: string, before: string): Promise<OlderMessagesResult> {
  if (!isUuid(matchId) || !before) return { error: "Invalid conversation.", messages: [], hasMore: false };
  const cursor = Date.parse(before);
  if (!Number.isFinite(cursor)) return { error: "Invalid message cursor.", messages: [], hasMore: false };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in.", messages: [], hasMore: false };

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,user_a,user_b")
    .eq("id", matchId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();
  if (matchError || !match) return { error: "This conversation is no longer available.", messages: [], hasMore: false };

  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: blockRecord } = await supabase
    .from("blocks")
    .select("id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
    .maybeSingle();
  if (blockRecord) return { error: "You cannot access this conversation.", messages: [], hasMore: false };

  const { data, error } = await supabase
    .from("messages")
    .select("id,sender_id,content,ciphertext,encryption_version,created_at")
    .eq("match_id", matchId)
    .lt("created_at", new Date(cursor).toISOString())
    .order("created_at", { ascending: false })
    .limit(41);
  if (error) return { error: "Couldn't load older messages.", messages: [], hasMore: false };

  const rows = (data ?? []) as OlderMessagesResult["messages"];
  const hasMore = rows.length > 40;
  return { error: null, messages: rows.slice(0, 40).reverse(), hasMore };
}

export async function sendMessage(matchId: string, ciphertext: string): Promise<SendMessageResult> {
  if (!isUuid(matchId)) return { error: "Invalid conversation." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to send a message." };

  const payload = ciphertext.trim();
  if (!payload) return { error: "Message cannot be empty." };
  if (payload.length > 12000) return { error: "Message is too long." };
  if (!payload.startsWith("v1.")) return { error: "Secure message encryption is required." };

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,user_a,user_b")
    .eq("id", matchId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();
  if (matchError || !match) return { error: "This conversation is no longer available." };

  const otherUserId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: blockRecord } = await supabase
    .from("blocks")
    .select("id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
    .maybeSingle();
  if (blockRecord) return { error: "You cannot message this user." };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: user.id, content: null, ciphertext: payload, encryption_version: 1 })
    .select("id,sender_id,content,ciphertext,encryption_version,created_at")
    .single();
  if (error) return { error: "Couldn't send the encrypted message. Please try again." };

  // Realtime is the source of truth for the open chat. Do not invalidate the
  // whole chat route on every message; that creates a server-rendering round
  // trip immediately after an insert the client already knows succeeded.
  // Push is also outside the response-critical path so notification latency
  // cannot make a message feel stuck.
  after(() =>
    sendPushToUser(otherUserId, {
      title: "New encrypted message",
      body: "You have a new secure message.",
      url: `${routes.messages}/${matchId}`,
      tag: `message-${matchId}`,
    })
  );

  return { error: null, message };
}

export async function respondToSuperChat(superChatId: string, accept: boolean): Promise<{ error: string | null; matchId?: string }> {
  if (!isUuid(superChatId)) return { error: "Invalid message request." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: request, error: requestError } = await supabase
    .from("superchats")
    .select("id,sender_id,recipient_id,status,content")
    .eq("id", superChatId)
    .eq("recipient_id", user.id)
    .maybeSingle();
  if (requestError || !request) return { error: "Message request is no longer available." };

  const { data: result, error } = await supabase.rpc("respond_to_superchat", {
    p_superchat_id: superChatId,
    p_accept: accept,
  });
  if (error) {
    const message = error.message || "Unable to respond to this request.";
    if (message.includes("REQUEST_ALREADY_HANDLED")) return { error: "This message request has already been handled." };
    if (message.includes("USER_UNAVAILABLE")) return { error: "This message request is no longer available." };
    return { error: "Unable to respond to this request. Please try again." };
  }

  const matchId = Array.isArray(result) ? result[0]?.match_id : result?.match_id;
  if (matchId) {
    revalidatePath(routes.messages);
    after(() =>
      sendPushToUser(request.sender_id, {
        title: "SuperChat accepted",
        body: "Your message request was accepted. You can chat now.",
        url: `${routes.messages}/${matchId}`,
        tag: `superchat-${superChatId}`,
      })
    );
  } else {
    revalidatePath(routes.messages);
  }
  return { error: null, matchId };
}

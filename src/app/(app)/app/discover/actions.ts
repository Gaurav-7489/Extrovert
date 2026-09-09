"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { isUuid } from "@/lib/validation";
import { sendPushToUser } from "@/lib/push/server";

export type LikeResult = { error: string | null; matched: boolean; matchId?: string };
export type ActionResult = { error: string | null; success?: boolean; count?: number };

type RpcClient = {
  rpc: (name: string, args: Record<string, string>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function likeProfile(profileId: string): Promise<LikeResult> {
  if (!isUuid(profileId)) return { error: "Invalid profile.", matched: false };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to like someone.", matched: false };
  if (user.id === profileId) return { error: "You cannot like your own profile.", matched: false };

  const { data: result, error } = await supabase.rpc("like_profile", { p_profile_id: profileId });
  if (error) {
    const m = error.message || "Couldn't save your like. Please try again.";
    if (m.includes("PROFILE_UNAVAILABLE")) return { error: "That profile is no longer available.", matched: false };
    if (m.includes("USER_UNAVAILABLE")) return { error: "This user is unavailable.", matched: false };
    if (m.includes("AUTH_REQUIRED")) return { error: "You must be logged in to like someone.", matched: false };
    if (m.includes("LIKE_LIMIT_REACHED")) return { error: "You're out of Likes for now. Unlock Beyond or get more Likes.", matched: false };
    return { error: "Couldn't save your like. Please try again.", matched: false };
  }

  const row = Array.isArray(result) ? result[0] : result;
  const matched = Boolean(row?.matched);
  const matchId = row?.match_id ?? undefined;

  // The swipe deck is already updated optimistically on the client. Avoid
  // invalidating/refreshing Discover after every swipe; that turns a local
  // interaction into another server render and defeats the instant UI.
  if (matched && matchId) revalidatePath(routes.matches);

  if (matched && matchId) {
    after(async () => {
      await Promise.all([
        sendPushToUser(profileId, {
          title: "It’s a Match!",
          body: "You matched on Extrovert Date.",
          url: `${routes.messages}/${matchId}`,
          tag: `match-${matchId}`,
        }),
        sendPushToUser(user.id, {
          title: "It’s a Match!",
          body: "You have a new match on Extrovert Date.",
          url: `${routes.messages}/${matchId}`,
          tag: `match-${matchId}`,
        }),
      ]);
    });
  } else {
    after(() =>
      sendPushToUser(profileId, {
        title: "Someone likes you",
        body: "Someone liked your dating profile. Open Extrovert Date to see who.",
        url: routes.discover,
        tag: `like-${user.id}`,
      })
    );
  }

  return { error: null, matched, matchId };
}

export async function superLikeProfile(profileId: string): Promise<ActionResult> {
  if (!isUuid(profileId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };
  const { error } = await (supabase as unknown as RpcClient).rpc("send_superlike", { p_recipient_id: profileId });
  if (error) {
    const m = error.message || "Couldn't send your Super Like.";
    if (m.includes("SUPERLIKE_EMPTY")) return { error: "You're out of Super Likes. Get more Super Likes to keep going." };
    if (m.includes("ALREADY_SENT")) return { error: "You've already Super Liked this profile." };
    if (m.includes("PROFILE_UNAVAILABLE")) return { error: "That profile is no longer available." };
    if (m.includes("USER_UNAVAILABLE")) return { error: "You can't interact with this user." };
    return { error: "Couldn't send your Super Like. Please try again." };
  }
  after(() => sendPushToUser(profileId, {
    title: "Someone Super Liked you",
    body: "You received a Super Like and earned 1 reward token.",
    url: `${routes.profileView}/${user.id}`,
    tag: `superlike-${user.id}`,
  }));
  revalidatePath(routes.profile);
  return { error: null, success: true };
}

export async function passProfile(profileId: string): Promise<ActionResult> {
  if (!isUuid(profileId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to pass someone." };
  if (user.id === profileId) return { error: "You cannot pass your own profile." };
  const { error } = await (supabase as unknown as RpcClient).rpc("pass_profile", { p_profile_id: profileId });
  if (error) {
    const m = error.message || "Couldn't save your pass. Please try again.";
    if (m.includes("PROFILE_UNAVAILABLE")) return { error: "That profile is no longer available." };
    if (m.includes("USER_UNAVAILABLE")) return { error: "You can't interact with this user." };
    if (m.includes("AUTH_REQUIRED")) return { error: "You must be logged in to pass someone." };
    if (m.includes("INVALID_PROFILE")) return { error: "Invalid profile." };
    return { error: "Couldn't save your pass. Please try again." };
  }
  // No Discover revalidation here. The client removes the card immediately.
  return { error: null, success: true };
}

export async function rewindLastPass(): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase as unknown as RpcClient).rpc("rewind_last_pass", {});
  if (error) {
    const m = error.message || "Couldn't rewind that profile. Please try again.";
    if (m.includes("PRO_REQUIRED")) return { error: "Rewind is a Beyond feature." };
    if (m.includes("AUTH_REQUIRED")) return { error: "You must be logged in." };
    return { error: "Couldn't rewind that profile. Please try again." };
  }
  if (!data) return { error: "There is nothing to rewind yet." };
  return { error: null, success: true };
}

export async function resetPassedProfiles(): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase as unknown as RpcClient).rpc("reset_passed_profiles", {});
  if (error) {
    const m = error.message || "Couldn't bring back passed profiles. Please try again.";
    if (m.includes("AUTH_REQUIRED")) return { error: "You must be logged in." };
    return { error: "Couldn't bring back passed profiles. Please try again." };
  }
  const count = Number(data ?? 0);
  return { error: null, success: true, count };
}

export async function blockUser(targetUserId: string): Promise<ActionResult> {
  if (!isUuid(targetUserId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to block a user." };
  if (user.id === targetUserId) return { error: "You cannot block yourself." };
  const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });
  if (error && error.code !== "23505") return { error: "Failed to block user. Please try again." };
  const [userA, userB] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id];
  await supabase.from("matches").delete().eq("user_a", userA).eq("user_b", userB);
  revalidatePath(routes.matches);
  revalidatePath(routes.messages);
  return { error: null, success: true };
}

export async function unblockUser(targetUserId: string): Promise<ActionResult> {
  if (!isUuid(targetUserId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to unblock a user." };
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
  if (error) return { error: "Failed to unblock user." };
  revalidatePath(routes.settings);
  return { error: null, success: true };
}

export async function reportUser(targetUserId: string, reason: string, details?: string): Promise<ActionResult> {
  if (!isUuid(targetUserId)) return { error: "Invalid profile." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to submit a report." };
  if (user.id === targetUserId) return { error: "You cannot report yourself." };
  if (!reason.trim()) return { error: "Please select a reason for the report." };
  if (reason.trim().length > 120 || (details?.trim().length ?? 0) > 500) return { error: "Report details are too long." };
  const { error: reportError } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id: targetUserId,
    reason: reason.trim(),
    details: details?.trim() || null,
  });
  if (reportError) return { error: "Failed to submit report. Please try again." };
  await supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id: targetUserId }, { onConflict: "blocker_id,blocked_id" });
  revalidatePath(routes.matches);
  return { error: null, success: true };
}

export async function toggleGhostMode(enabled: boolean): Promise<ActionResult> {
  if (typeof enabled !== "boolean") return { error: "Invalid Ghost Mode value." };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };
  const { data: isPro, error: proError } = await supabase.rpc("is_datebu_pro");
  if (proError) return { error: "Couldn't verify your Beyond access. Please try again." };
  if (!isPro && enabled) return { error: "Ghost Mode is a Beyond feature. Unlock Beyond to turn it on." };
  const { data: updated, error } = await supabase.from("profiles").update({ ghost_mode: enabled }).eq("id", user.id).select("ghost_mode").maybeSingle();
  if (error) return { error: "Failed to update Ghost Mode. Please try again." };
  if (!updated) return { error: "Your profile could not be found. Please refresh and try again." };
  revalidatePath(routes.settings);
  revalidatePath(routes.profile);
  revalidatePath(routes.discover);
  revalidatePath(routes.app);
  return { error: null, success: true };
}

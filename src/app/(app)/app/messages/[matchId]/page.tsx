import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { isUuid } from "@/lib/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ChatLoader } from "./chat-loader";

export const metadata: Metadata = { title: "Secure Chat | DateBu" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ matchId: string }> };
type MatchProfile = {
  id: string;
  display_name: string | null;
  department: string | null;
  academic_year: string | null;
  relationship_goal: string | null;
  campus_residency: string | null;
  campus_hangout: string | null;
  zodiac: string | null;
  prompt_question: string | null;
  prompt_answer: string | null;
  verification_status: string | null;
  profile_photos: Array<{
    storage_path: string;
    display_order: number;
    is_primary: boolean;
  }>;
};
type StoredMessage = {
  id: string;
  sender_id: string;
  content: string | null;
  ciphertext: string | null;
  encryption_version: number;
  created_at: string;
};
const INITIAL_MESSAGE_LIMIT = 40;

export default async function ChatPage({ params }: Props) {
  const { matchId } = await params;
  if (!isUuid(matchId)) notFound();
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect(routes.login);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id,user_a,user_b")
    .eq("id", matchId)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();
  if (matchError || !match) notFound();
  const otherUserId = match.user_a === userId ? match.user_b : match.user_a;

  const [
    { data: blockRecord },
    { data: profileRows, error: profileError },
    { data: identity },
    { data: messages, error: messagesError },
  ] = await Promise.all([
    supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`
      )
      .maybeSingle(),
    supabase.rpc("get_match_profiles", { p_user_ids: [otherUserId] }),
    supabase
      .from("extrovert_profiles")
      .select("verification_status")
      .eq("id", otherUserId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id,sender_id,content,ciphertext,encryption_version,created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(INITIAL_MESSAGE_LIMIT),
  ]);

  if (blockRecord) redirect(routes.messages);
  if (profileError) notFound();
  if (messagesError) console.error("Failed to load messages:", messagesError);
  const profile = (profileRows?.[0] ?? null) as MatchProfile | null;
  if (!profile) notFound();
  const photos = [...(profile.profile_photos ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.display_order - b.display_order
  );
  const photoUrl = getProfilePhotoUrl(photos[0]?.storage_path, 160);
  const verifiedProfile = {
    ...profile,
    verification_status:
      identity?.verification_status ?? profile.verification_status ?? null,
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden font-sans">
      <ChatLoader
        matchId={matchId}
        currentUserId={userId}
        otherUserId={otherUserId}
        otherProfile={verifiedProfile}
        otherPhotoUrl={photoUrl}
        initialMessages={[...(messages ?? [])].reverse() as StoredMessage[]}
      />
    </div>
  );
}
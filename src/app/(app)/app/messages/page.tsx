import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MessageSquare,
  Flame,
  HeartHandshake,
  LockKeyhole,
  Search,
  Users,
  ShieldCheck,
} from "lucide-react";
import SuperChatRequestCard from "@/components/messages/superchat-request-card";

export const metadata: Metadata = { title: "Chat | DateBu" };
export const dynamic = "force-dynamic";

type Match = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

type DateMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string | null;
  ciphertext: string | null;
  encryption_version: number;
  created_at: string;
};

type DateProfile = {
  id: string;
  display_name: string | null;
  department: string | null;
  academic_year: string | null;
  date_of_birth: string | null;
  profile_photos: Array<{
    storage_path: string;
    display_order: number;
    is_primary: boolean;
  }> | null;
};

type DateIdentity = {
  id: string;
  verification_status: string | null;
};

type SocialConversation = {
  id: string;
  connection_id: string;
  created_at: string;
};

type SocialConnection = {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
};

type SocialProfile = {
  id: string;
  display_name: string | null;
  department: string | null;
  profile_photo_path: string | null;
  verification_status: string | null;
};

type SocialMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  created_at: string;
};

type Request = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  display_name: string;
  department: string;
  academic_year: string;
  profile_photos: {
    storage_path: string;
    is_primary: boolean;
    display_order: number;
  }[];
};

type Chat = {
  key: string;
  href: string;
  name: string;
  photoUrl: string | null;
  latest: string;
  createdAt: string;
  mine: boolean;
  kind: "Social" | "Dating";
  verified: boolean;
};

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: rawMatches, error: matchesError }, { data: requestRows }, { data: memberRows }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id,user_a,user_b,created_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_superchat_requests"),
      supabase
        .from("extrovert_conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id),
    ]);

  const requests = (requestRows ?? []) as Request[];
  const matches = (rawMatches ?? []) as Match[];
  const matchIds = matches.map((m) => m.id);
  const socialConversationIds = Array.from(
    new Set((memberRows ?? []).map((r: { conversation_id: string }) => r.conversation_id))
  );
  const otherDateIds = Array.from(
    new Set(matches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a)))
  );

  const [dateMessagesRes, dateProfilesRes, dateIdentitiesRes, socialConversationsRes] =
    await Promise.all([
      matchIds.length
        ? supabase.rpc("get_latest_dating_messages", { p_match_ids: matchIds })
        : Promise.resolve({ data: [], error: null }),
      matchIds.length
        ? supabase.rpc("get_match_profiles", { p_user_ids: otherDateIds })
        : Promise.resolve({ data: [], error: null }),
      otherDateIds.length
        ? supabase
            .from("extrovert_profiles")
            .select("id,verification_status")
            .in("id", otherDateIds)
        : Promise.resolve({ data: [], error: null }),
      socialConversationIds.length
        ? supabase
            .from("extrovert_conversations")
            .select("id,connection_id,created_at")
            .in("id", socialConversationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const dateMessages = (dateMessagesRes.data ?? []) as DateMessage[];
  const dateProfiles = (dateProfilesRes.data ?? []) as DateProfile[];
  const dateIdentityMap = new Map(
    ((dateIdentitiesRes.data ?? []) as DateIdentity[]).map((p) => [p.id, p])
  );
  const dateProfileMap = new Map(dateProfiles.map((p) => [p.id, p]));

  const latestDate = new Map<string, DateMessage>();
  for (const message of dateMessages) {
    if (!latestDate.has(message.match_id)) latestDate.set(message.match_id, message);
  }

  const socialConversations = (socialConversationsRes.data ?? []) as SocialConversation[];
  const connectionIds = socialConversations.map((c) => c.connection_id);

  const [{ data: connections }, { data: socialMessages }] = await Promise.all([
    connectionIds.length
      ? supabase
          .from("extrovert_connections")
          .select("id,requester_id,target_id,status")
          .in("id", connectionIds)
          .eq("status", "accepted")
      : Promise.resolve({ data: [], error: null }),
    socialConversationIds.length
      ? supabase.rpc("get_latest_social_messages", {
          p_conversation_ids: socialConversationIds,
        })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const socialConnections = (connections ?? []) as SocialConnection[];
  const socialOtherIds = Array.from(
    new Set(
      socialConnections.map((c) =>
        c.requester_id === user.id ? c.target_id : c.requester_id
      )
    )
  );

  const { data: socialProfiles } = socialOtherIds.length
    ? await supabase
        .from("extrovert_profiles")
        .select("id,display_name,department,profile_photo_path,verification_status")
        .in("id", socialOtherIds)
    : { data: [] };

  const socialProfileMap = new Map(
    (socialProfiles ?? []).map((p) => [p.id, p as SocialProfile])
  );

  const latestSocial = new Map<string, SocialMessage>();
  for (const message of (socialMessages ?? []) as SocialMessage[]) {
    if (!latestSocial.has(message.conversation_id))
      latestSocial.set(message.conversation_id, message);
  }

  const datingChats: Chat[] = [];
  const newMatches: {
    matchId: string;
    profile: DateProfile;
    photoUrl: string | null;
  }[] = [];

  for (const match of matches) {
    const other = match.user_a === user.id ? match.user_b : match.user_a;
    const profile = dateProfileMap.get(other);
    if (!profile) continue;

    const photos = [...(profile.profile_photos ?? [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.display_order - b.display_order
    );
    const photoUrl = getProfilePhotoUrl(photos[0]?.storage_path, 160);
    const latest = latestDate.get(match.id);

    if (!latest) {
      newMatches.push({ matchId: match.id, profile, photoUrl });
    } else {
      datingChats.push({
        key: `dating-${match.id}`,
        href: `${routes.messages}/${match.id}`,
        name: profile.display_name ?? "Match",
        photoUrl,
        latest:
          latest.encryption_version === 1
            ? "Encrypted message"
            : latest.content ?? "Message",
        createdAt: latest.created_at,
        mine: latest.sender_id === user.id,
        kind: "Dating",
        verified: dateIdentityMap.get(other)?.verification_status === "verified",
      });
    }
  }

  const socialChats: Chat[] = [];
  for (const conversation of socialConversations) {
    const connection = socialConnections.find(
      (c) => c.id === conversation.connection_id
    );
    if (!connection) continue;

    const other =
      connection.requester_id === user.id
        ? connection.target_id
        : connection.requester_id;
    const profile = socialProfileMap.get(other);
    if (!profile) continue;

    const latest = latestSocial.get(conversation.id);
    if (!latest) continue;

    socialChats.push({
      key: `social-${conversation.id}`,
      href: `${routes.messages}/social/${conversation.id}`,
      name: profile.display_name ?? "Connection",
      photoUrl: getProfilePhotoUrl(profile.profile_photo_path, 160),
      latest: "Encrypted message",
      createdAt: latest.created_at,
      mine: latest.sender_id === user.id,
      kind: "Social",
      verified: profile.verification_status === "verified",
    });
  }

  const chats = [...datingChats, ...socialChats].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="mx-auto w-full max-w-md px-3.5 pb-24 pt-3 font-sans text-zinc-950 dark:text-zinc-50 sm:px-4">
      {/* Header */}
      <header className="px-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
              CONNECTIONS
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Messages
            </h1>
          </div>
          <Link
            href={routes.social}
            aria-label="Social connections"
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs transition-all hover:border-[#550000]/30 hover:text-[#550000] active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-300 dark:hover:border-[#550000]/40 dark:hover:text-red-400"
          >
            <Users className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 flex h-10 items-center gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 px-3.5 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#141419]">
          <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            Search conversations…
          </span>
        </div>
      </header>

      {/* New Matches Story Row */}
      {newMatches.length > 0 && (
        <section className="mt-4">
          <div className="mb-2.5 flex items-center gap-1.5 px-1">
            <Flame className="h-3.5 w-3.5 fill-current text-[#550000] dark:text-red-400" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              New matches
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
            {newMatches.map((m) => (
              <Link
                key={m.matchId}
                href={`${routes.messages}/${m.matchId}`}
                className="group flex w-16 shrink-0 flex-col items-center text-center transition-transform active:scale-95"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#550000] p-0.5 bg-white shadow-2xs dark:bg-[#16161d] dark:border-red-500/80">
                  {m.photoUrl ? (
                    <Image
                      src={m.photoUrl}
                      alt={m.profile.display_name ?? ""}
                      fill
                      sizes="56px"
                      className="rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center rounded-full bg-[#550000]/10 text-xs font-bold text-[#550000] dark:bg-[#550000]/25 dark:text-red-300">
                      {m.profile.display_name?.charAt(0) ?? "?"}
                    </div>
                  )}
                </div>
                <span className="mt-1.5 block w-full truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                  {m.profile.display_name?.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SuperChat / Message Requests */}
      {requests.length > 0 && (
        <section className="mt-4">
          <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Message requests ({requests.length})
          </div>
          <div className="space-y-2">
            {requests.map((r) => (
              <SuperChatRequestCard
                key={r.id}
                requestId={r.id}
                senderName={r.display_name}
                content={r.content}
              />
            ))}
          </div>
        </section>
      )}

      {/* Conversation List / Fallbacks */}
      {matchesError ? (
        <div className="mt-5">
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="Couldn&apos;t load messages"
            description="Please try again in a moment."
          />
        </div>
      ) : chats.length === 0 && newMatches.length === 0 && requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<HeartHandshake className="h-6 w-6" />}
            title="No conversations yet"
            description="Your matches and social connections will appear here once you connect."
          />
        </div>
      ) : (
        <section className="mt-5">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Conversations</span>
          </div>

          <div className="space-y-1.5">
            {chats.map((chat) => (
              <ConversationItem key={chat.key} chat={chat} />
            ))}
          </div>
        </section>
      )}

      {chats.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          <LockKeyhole className="h-3 w-3" />
          <span>Protected conversations with end-to-end encryption</span>
        </div>
      )}
    </main>
  );
}

function ConversationItem({ chat }: { chat: Chat }) {
  return (
    <Link
      href={chat.href}
      className="group flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-2.5 shadow-2xs transition-all duration-150 hover:border-zinc-200 hover:bg-zinc-50/70 active:scale-[0.99] dark:border-white/5 dark:bg-[#121216] dark:hover:border-white/10 dark:hover:bg-[#16161d]"
    >
      <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-black/5 dark:bg-[#181820] dark:ring-white/10">
        {chat.photoUrl ? (
          <Image
            src={chat.photoUrl}
            alt={chat.name}
            fill
            sizes="52px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-[#550000] dark:text-red-400">
            {chat.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
            {chat.name}
          </p>
          {chat.verified && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#550000] dark:text-red-400" />
          )}
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[8px] font-bold text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            {chat.kind}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {chat.mine ? (
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              You:{" "}
            </span>
          ) : null}
          {chat.latest}
        </p>
      </div>

      <time className="shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
        {formatRelative(chat.createdAt)}
      </time>
    </Link>
  );
}

function formatRelative(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7
    ? `${days}d`
    : new Date(value).toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
}
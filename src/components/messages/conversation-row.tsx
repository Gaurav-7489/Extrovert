"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";

type ConversationRowProps = {
  matchId: string;
  profileId: string;
  displayName: string | null;
  photoUrl?: string | null;
  latestContent: string;
  timestamp: string;
  sent: boolean;
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationRow({ matchId, profileId, displayName, photoUrl, latestContent, timestamp, sent }: ConversationRowProps) {
  const router = useRouter();
  const chatHref = `${routes.messages}/${matchId}`;
  const profileHref = `${routes.profileView}/${profileId}`;
  const openChat = () => router.push(chatHref);
  const name = displayName ?? "Student";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openChat}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openChat();
        }
      }}
      className="group flex min-h-[72px] cursor-pointer items-center justify-between rounded-2xl border border-[#272C35] bg-[#111318] px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition duration-150 hover:border-[#E04A4A]/25 hover:bg-[#14171c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E04A4A]/40 active:scale-[.995]"
      aria-label={`Open chat with ${name}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <a
          href={profileHref}
          onClick={(e) => e.stopPropagation()}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#272C35] bg-[#181B21]"
          aria-label={`View ${name}'s profile`}
        >
          {photoUrl ? (
            <Image src={photoUrl} alt={name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#E04A4A]">{name.charAt(0)}</div>
          )}
        </a>
        <div className="min-w-0 py-0.5">
          <a href={profileHref} onClick={(e) => e.stopPropagation()} className="block truncate text-sm font-bold text-[#F5F7FA]">
            {name}
          </a>
          <p className="mt-0.5 truncate text-xs text-[#9AA3B2]">
            {sent && <span className="font-semibold text-[#C8CED8]">You: </span>}
            {latestContent}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openChat(); }}
        className="shrink-0 pl-3 text-[10px] font-semibold text-[#687181] transition group-hover:text-[#9AA3B2]"
        aria-label={`Open chat with ${name}, ${formatTimestamp(timestamp)}`}
      >
        {formatTimestamp(timestamp)}
      </button>
    </div>
  );
}

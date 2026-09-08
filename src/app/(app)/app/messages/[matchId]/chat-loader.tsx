"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LazyChatClient = dynamic(() => import("./chat-client").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-40 flex-1 items-center justify-center bg-[#08090B]" role="status" aria-label="Loading chat">
      <div className="flex items-center gap-2 rounded-full border border-[#272C35] bg-[#111318] px-3 py-2 text-xs font-semibold text-[#9AA3B2]">
        <Loader2 className="h-4 w-4 animate-spin text-[#E04A4A]" />
        Opening secure chat
      </div>
    </div>
  ),
});

export function ChatLoader(props: React.ComponentProps<typeof LazyChatClient>) {
  return <LazyChatClient {...props} />;
}

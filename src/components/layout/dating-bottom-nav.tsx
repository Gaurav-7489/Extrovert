"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Users, MessageCircle, UserRound } from "lucide-react";
const items = [
  { href: "/app/feed", label: "Home", Icon: House },
  { href: "/app/reels", label: "Reels", Icon: Compass },
  { href: "/app/discover", label: "People", Icon: Users },
  { href: "/app/messages", label: "Chats", Icon: MessageCircle },
  { href: "/app/profile", label: "Profile", Icon: UserRound },
];
export function DatingBottomNav() {
  const pathname = usePathname();
  return <nav aria-label="Primary navigation" className="shrink-0 border-t border-white/10 bg-[#101013]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
    <div className="mx-auto flex h-14 max-w-3xl items-center justify-around px-2">
      {items.map(({href,label,Icon}) => {
        const active=pathname===href||pathname.startsWith(href+"/");
        return <Link key={href} href={href} aria-current={active?"page":undefined} className={"flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 text-[10px] transition-colors "+(active?"text-white":"text-zinc-500 hover:text-zinc-200")}>
          <Icon className="h-[19px] w-[19px]" strokeWidth={active?2.3:1.7}/><span>{label}</span>
        </Link>;
      })}
    </div>
  </nav>;
}

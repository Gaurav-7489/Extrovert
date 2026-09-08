"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, UserRound, Sparkles } from "lucide-react";
import { routes } from "@/config/routes";

const items = [
  { href: routes.discover, label: "Discover", Icon: Compass },
  { href: routes.explore, label: "Explore", Icon: Sparkles },
  { href: routes.likes, label: "Likes", Icon: Heart },
  { href: routes.messages, label: "Chat", Icon: MessageCircle },
  { href: routes.profile, label: "Profile", Icon: UserRound },
];

export function DatingBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#22222a]/90 bg-[#0a0a0c]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[430px] items-center justify-around px-2">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-transform duration-150 active:scale-[0.96] ${
                active ? "text-[#f5f5f7]" : "text-[#70707a]"
              }`}
            >
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-full transition-[background-color,transform] duration-150 ${
                  active
                    ? "bg-[#550000]/30"
                    : "bg-transparent group-hover:bg-white/5"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 1.9}
                />
              </span>
              <span
                className={`text-[10px] tracking-tight ${
                  active ? "font-bold text-[#f5f5f7]" : "font-medium text-[#70707a]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
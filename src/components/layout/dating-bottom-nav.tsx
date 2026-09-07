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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#0a0a0c]/95">
      <div className="mx-auto flex h-[68px] w-full max-w-[428px] items-center justify-around px-1">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-150 active:scale-95 ${
                active
                  ? "text-[#550000] dark:text-red-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <div
                className={`relative flex h-8 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "bg-[#550000]/10 dark:bg-[#550000]/25"
                    : "bg-transparent group-hover:bg-zinc-100/60 dark:group-hover:bg-white/5"
                }`}
              >
                <Icon
                  className="h-5 w-5 transition-transform duration-150 group-hover:scale-105"
                  strokeWidth={active ? 2.4 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-tight transition-colors ${
                  active
                    ? "text-[#550000] dark:text-red-400 font-bold"
                    : "text-zinc-500 dark:text-zinc-400"
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
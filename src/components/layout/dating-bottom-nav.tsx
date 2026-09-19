"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, UserRound, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { routes } from "@/config/routes";

const items = [
  { href: routes.discover, label: "Discover", Icon: Compass },
  { href: routes.explore, label: "Plans", Icon: Sparkles },
  { href: routes.likes, label: "Likes", Icon: Heart },
  { href: routes.messages, label: "Chats", Icon: MessageCircle },
  { href: routes.profile, label: "You", Icon: UserRound },
];

export function DatingBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 px-2.5 pb-[max(.55rem,env(safe-area-inset-bottom))]"
    >
      <div className="extrovert-glass pointer-events-auto mx-auto flex h-[72px] w-full items-center rounded-[24px] px-1.5 shadow-[0_-8px_34px_rgba(0,0,0,.24),0_15px_40px_rgba(0,0,0,.3)]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={
                "pressable relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[18px] py-1.5 " +
                (active ? "text-white" : "text-[#6f7685]")
              }
            >
              <span className="relative grid h-8 w-11 place-items-center">
                {active ? (
                  <motion.span
                    layoutId="extrovert-bottom-nav"
                    transition={{ type: "spring", stiffness: 560, damping: 42, mass: 0.6 }}
                    className="absolute inset-0 rounded-full bg-[rgb(var(--brand-red)/.16)] ring-1 ring-[rgb(var(--brand-red)/.16)]"
                  />
                ) : null}
                <Icon
                  className="relative z-10 h-[19px] w-[19px]"
                  strokeWidth={active ? 2.45 : 1.9}
                />
              </span>
              <span
                className={
                  "relative z-10 truncate text-[9px] leading-none tracking-[-.01em] " +
                  (active ? "font-extrabold" : "font-semibold")
                }
              >
                {label}
              </span>
              {active ? (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_8px_rgb(var(--brand-red)/.8)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

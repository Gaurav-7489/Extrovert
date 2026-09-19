"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, UserRound, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
  const reducedMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 px-2.5 pb-[max(.55rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto relative mx-auto flex h-[70px] w-full items-center overflow-hidden rounded-[24px] border border-white/[.08] bg-[#09090c]/92 px-1.5 shadow-[0_-10px_36px_rgba(0,0,0,.28),0_18px_44px_rgba(0,0,0,.42)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--brand-red)/.44)] to-transparent" />

        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={
                "pressable relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] rounded-[18px] py-1.5 " +
                (active ? "text-white" : "text-[#686b76]")
              }
            >
              {active ? (
                <motion.span
                  layoutId="extrovert-nav-light"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 540, damping: 42, mass: 0.58 }
                  }
                  className="absolute top-0 h-[2px] w-7 rounded-full bg-[rgb(var(--brand-red))] shadow-[0_0_12px_rgb(var(--brand-red)/.85)]"
                />
              ) : null}

              <span className="relative grid h-9 w-11 place-items-center">
                {active ? (
                  <motion.span
                    layoutId="extrovert-bottom-nav"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 520, damping: 40, mass: 0.62 }
                    }
                    className="absolute inset-[2px] rounded-full border border-[rgb(var(--brand-red)/.14)] bg-[rgb(var(--brand-red)/.12)] shadow-[0_0_18px_rgb(var(--brand-red)/.055)]"
                  />
                ) : null}

                <motion.span
                  animate={reducedMotion ? undefined : { y: active ? -1 : 0, scale: active ? 1.04 : 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                  className="relative z-10"
                >
                  <Icon
                    className="h-[19px] w-[19px]"
                    strokeWidth={active ? 2.5 : 1.85}
                  />
                </motion.span>
              </span>

              <span
                className={
                  "relative z-10 truncate text-[9px] leading-none tracking-[-.01em] " +
                  (active ? "font-black text-zinc-100" : "font-semibold")
                }
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

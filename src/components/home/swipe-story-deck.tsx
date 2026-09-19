"use client";

import { useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  CalendarDays,
  Heart,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";

type PreviewCard = {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  accent: "brand" | "success" | "info";
  icon: "heart" | "plan" | "chat";
};

const initialCards: PreviewCard[] = [
  {
    id: "people",
    eyebrow: "DISCOVER",
    title: "Someone interesting is closer than you think.",
    detail: "Shared energy · nearby · your pace",
    accent: "brand",
    icon: "heart",
  },
  {
    id: "plans",
    eyebrow: "PLANS",
    title: "Coffee. Walk. Movie. Make something happen.",
    detail: "Open plan · 4 people · tonight",
    accent: "success",
    icon: "plan",
  },
  {
    id: "chat",
    eyebrow: "CHATS",
    title: "Skip the dry opener. Start with context.",
    detail: "Matched · conversation ready",
    accent: "info",
    icon: "chat",
  },
];

const accentMap = {
  brand: {
    shell: "border-[rgb(var(--brand-red)/.28)] bg-[linear-gradient(155deg,rgb(var(--brand-red)/.16),rgba(11,11,14,.98)_42%)]",
    badge: "border-[rgb(var(--brand-red)/.28)] bg-[rgb(var(--brand-red)/.12)] text-[rgb(var(--brand-red))]",
    dot: "bg-[rgb(var(--brand-red))] shadow-[0_0_18px_rgb(var(--brand-red)/.75)]",
  },
  success: {
    shell: "border-emerald-500/25 bg-[linear-gradient(155deg,rgba(16,185,129,.13),rgba(11,11,14,.98)_42%)]",
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.6)]",
  },
  info: {
    shell: "border-sky-500/25 bg-[linear-gradient(155deg,rgba(14,165,233,.12),rgba(11,11,14,.98)_42%)]",
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,.55)]",
  },
} as const;

function IconFor({ kind }: { kind: PreviewCard["icon"] }) {
  if (kind === "plan") return <CalendarDays className="h-5 w-5" />;
  if (kind === "chat") return <MessageCircle className="h-5 w-5" />;
  return <Heart className="h-5 w-5 fill-current" />;
}

export function SwipeStoryDeck() {
  const [cards, setCards] = useState(initialCards);
  const x = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const rotate = useTransform(x, [-180, 0, 180], [-7, 0, 7]);
  const rightGlow = useTransform(x, [0, 90], [0, 1]);
  const leftGlow = useTransform(x, [-90, 0], [1, 0]);

  const visible = useMemo(() => cards.slice(0, 3), [cards]);

  function cycle(direction: "left" | "right") {
    setCards((current) => {
      const [first, ...rest] = current;
      return first ? [...rest, first] : current;
    });
    x.set(0);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(direction === "right" ? 7 : 5);
    }
  }

  return (
    <div className="relative">
      <div className="relative h-[288px]">
        {[...visible].reverse().map((card, reverseIndex) => {
          const index = visible.length - 1 - reverseIndex;
          const isTop = index === 0;
          const accent = accentMap[card.accent];

          return (
            <motion.article
              key={card.id}
              drag={isTop && !reducedMotion ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_event, info) => {
                if (
                  Math.abs(info.offset.x) > 72 ||
                  Math.abs(info.velocity.x) > 620
                ) {
                  cycle(info.offset.x >= 0 ? "right" : "left");
                }
              }}
              style={
                isTop
                  ? {
                      x,
                      rotate,
                      zIndex: 30,
                    }
                  : { zIndex: 30 - index }
              }
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: index * 11,
                      scale: 1 - index * 0.045,
                      opacity: 1 - index * 0.16,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 38,
                mass: 0.7,
              }}
              className={
                "absolute inset-x-0 top-0 h-[248px] overflow-hidden rounded-[30px] border p-5 shadow-[0_24px_70px_rgba(0,0,0,.48)] will-change-transform " +
                accent.shell
              }
            >
              {isTop ? (
                <>
                  <motion.div
                    style={{ opacity: rightGlow }}
                    className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-emerald-400/12 to-transparent"
                  />
                  <motion.div
                    style={{ opacity: leftGlow }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[rgb(var(--brand-red)/.12)] to-transparent"
                  />
                </>
              ) : null}

              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black tracking-[.16em] " +
                      accent.badge
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + accent.dot} />
                    {card.eyebrow}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-[15px] border border-white/[.08] bg-white/[.035] text-zinc-200">
                    <IconFor kind={card.icon} />
                  </span>
                </div>

                <div className="mt-auto">
                  <h3 className="max-w-[15ch] text-[25px] font-black leading-[.98] tracking-[-.045em] text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[10px] font-semibold tracking-wide text-zinc-500">
                    {card.detail}
                  </p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="-mt-3 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-zinc-600">
        <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--brand-red))]" />
        swipe the preview
        <Users className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

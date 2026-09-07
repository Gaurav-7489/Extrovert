"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PageContainerProps extends HTMLMotionProps<"main"> {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  title?: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  withAmbientGlow?: boolean;
}

export function PageContainer({
  children,
  className,
  narrow = false,
  title,
  description,
  badge,
  action,
  withAmbientGlow = false,
  ...props
}: PageContainerProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "relative mx-auto w-full min-h-0 px-4 py-4 sm:px-5 sm:py-5",
        "max-w-md", // Ensures DateBu preserves a focused mobile-app canvas across all screens
        narrow ? "max-w-sm" : "max-w-md",
        className
      )}
      {...props}
    >
      {withAmbientGlow && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full bg-[#550000]/12 blur-3xl dark:bg-[#550000]/22" />
        </div>
      )}

      {(title || description || badge || action) && (
        <div className="mb-6 flex flex-col gap-3.5 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <div className="space-y-1.5">
            {badge && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#550000]/20 bg-[#550000]/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#550000] dark:border-[#550000]/35 dark:bg-[#550000]/15 dark:text-red-300">
                <Sparkles className="h-3 w-3 text-[#550000] dark:text-red-400" />
                <span>{badge}</span>
              </div>
            )}

            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[26px]">
                {title}
              </h1>
            )}

            {description && (
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="flex items-center gap-2 self-start pt-1">
              {action}
            </div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.25,
          delay: 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </motion.main>
  );
}
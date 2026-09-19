"use client";

import { useEffect, useState } from "react";

export type LoadingStage =
  | "starting"
  | "session"
  | "preferences"
  | "profiles"
  | "photos"
  | "finishing";

const STAGES: Record<
  LoadingStage,
  {
    label: string;
    progress: number;
  }
> = {
  starting: {
    label: "Starting Extrovert",
    progress: 8,
  },
  session: {
    label: "Checking your session",
    progress: 20,
  },
  preferences: {
    label: "Finding people who match you",
    progress: 42,
  },
  profiles: {
    label: "Loading profiles",
    progress: 65,
  },
  photos: {
    label: "Preparing profiles",
    progress: 84,
  },
  finishing: {
    label: "Almost ready",
    progress: 96,
  },
};

interface PageLoadingStatusProps {
  stage: LoadingStage;
  visible?: boolean;
}

export function PageLoadingStatus({
  stage,
  visible = true,
}: PageLoadingStatusProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  const current = STAGES[stage] ?? STAGES.starting;

  return (
    <div
      className="pointer-events-none w-full px-4 pt-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-[rgb(var(--border-color))]/70 bg-[rgb(var(--bg-surface))]/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Subtle status dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <p className="truncate text-[11px] font-bold text-[rgb(var(--text-primary))]">
                {current.label}
              </p>
            </div>

            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[rgb(var(--text-muted))]">
              {current.progress}%
            </span>
          </div>

          {/* High-Performance Progress Bar */}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[rgb(var(--text-muted))]/15">
            <div
              className="h-full w-full origin-left rounded-full bg-emerald-500 transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `scaleX(${current.progress / 100})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
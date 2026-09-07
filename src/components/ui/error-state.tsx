"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section. Please try again.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "my-6 flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white p-7 text-center font-sans shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-colors dark:border-rose-950/60 dark:bg-[#121216] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] sm:p-10",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50 text-rose-600 shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
        <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
      </div>

      <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-lg">
        {title}
      </h3>

      {message && (
        <p className="mt-1.5 max-w-xs text-xs font-normal leading-relaxed text-zinc-500 dark:text-zinc-400 sm:max-w-sm sm:text-sm">
          {message}
        </p>
      )}

      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-[#550000]/30 bg-[#550000] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#550000]/25 transition-all duration-150 hover:bg-[#680202] active:scale-95 cursor-pointer dark:bg-[#550000] dark:hover:bg-[#6e0303]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
}
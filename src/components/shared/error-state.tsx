"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message = "An unexpected error occurred while loading this campus module. Please try again.", onRetry, className, ...props }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "my-6 flex flex-col items-center justify-center rounded-[1.75rem] border border-[#272C35] bg-[#111318] p-7 text-center font-sans shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
        <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
      </div>
      <h3 className="text-[17px] font-bold tracking-tight text-[#F5F7FA]">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-[#9AA3B2]">{message}</p>}
      {onRetry && (
        <div className="mt-5">
          <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E04A4A]/30 bg-[#E04A4A] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(224,74,74,0.18)] transition hover:bg-[#d13f3f] active:scale-[.98]">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}

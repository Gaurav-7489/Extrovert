import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-zinc-200/90 bg-white p-7 text-center font-sans shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:p-10",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-2xl text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
        {typeof icon === "string" ? (
          <span aria-hidden="true">{icon}</span>
        ) : (
          icon
        )}
      </div>

      <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-lg">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-xs text-xs font-normal leading-relaxed text-zinc-500 dark:text-zinc-400 sm:max-w-sm sm:text-sm">
          {description}
        </p>
      )}

      {children && (
        <div className="mt-5 flex w-full justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
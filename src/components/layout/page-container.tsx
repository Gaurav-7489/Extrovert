import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
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
    <main
      className={cn(
        "extrovert-enter relative mx-auto min-h-0 w-full bg-transparent px-3.5 py-4 text-foreground",
        narrow ? "max-w-sm" : "max-w-md",
        className
      )}
      {...props}
    >
      {withAmbientGlow ? (
        <div className="pointer-events-none absolute inset-x-0 -top-12 -z-10 mx-auto h-44 w-[80%] rounded-full bg-[rgb(var(--brand-red)/.08)] blur-3xl" aria-hidden="true" />
      ) : null}

      {title || description || badge || action ? (
        <div className="mb-5 flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            {badge ? (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--brand-red)/.18)] bg-[rgb(var(--brand-red)/.08)] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[rgb(var(--brand-red))]">
                <Sparkles className="h-3 w-3" />
                <span>{badge}</span>
              </div>
            ) : null}

            {title ? (
              <h1 className="text-[26px] font-black leading-[1.05] tracking-[-0.045em] text-zinc-50">
                {title}
              </h1>
            ) : null}

            {description ? (
              <p className="mt-2 max-w-[30ch] text-xs leading-5 text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>

          {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
        </div>
      ) : null}

      <div className="w-full">{children}</div>
    </main>
  );
}

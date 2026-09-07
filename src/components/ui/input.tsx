import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, memo } from "react";
import { AlertCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        className,
        label,
        error,
        id,
        leftIcon,
        rightIcon,
        required,
        ...props
      },
      ref
    ) => {
      const inputId =
        id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
      const errorId = error && inputId ? `${inputId}-error` : undefined;

      return (
        <div className="flex w-full flex-col gap-1.5 font-sans">
          {label && (
            <label
              htmlFor={inputId}
              className="ml-1 text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300"
            >
              {label}
              {required && <span className="ml-1 text-[#550000] dark:text-red-400">*</span>}
            </label>
          )}

          <div className="group relative flex items-center">
            {leftIcon && (
              <div className="pointer-events-none absolute left-3.5 text-zinc-400 transition-colors group-focus-within:text-[#550000] dark:text-zinc-500 dark:group-focus-within:text-red-400">
                {leftIcon}
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              required={required}
              className={cn(
                "h-11 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-4 text-xs font-medium text-zinc-900 shadow-2xs placeholder:font-normal placeholder:text-zinc-400 transition-all duration-150 focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#550000]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000] dark:focus:bg-[#121216] dark:focus:ring-[#550000]/25",
                leftIcon ? "pl-11" : undefined,
                rightIcon ? "pr-11" : undefined,
                error &&
                  "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-900/60 dark:bg-rose-950/20 dark:focus:border-rose-500 dark:focus:ring-rose-500/20",
                className
              )}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={errorId}
              {...props}
            />

            {rightIcon && (
              <div className="pointer-events-none absolute right-3.5 text-zinc-400 transition-colors group-focus-within:text-[#550000] dark:text-zinc-500 dark:group-focus-within:text-red-400">
                {rightIcon}
              </div>
            )}
          </div>

          {error && (
            <p
              id={errorId}
              className="ml-1 flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      );
    }
  )
);

Input.displayName = "Input";
export type { InputProps };
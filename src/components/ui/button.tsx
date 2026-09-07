import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef, memo } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "gradient";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#550000] text-white shadow-sm shadow-[#550000]/25 hover:bg-[#680202] active:bg-[#440000] dark:bg-[#550000] dark:hover:bg-[#6e0303] dark:shadow-black/50 border border-[#550000]/30",
  secondary:
    "border border-[#550000]/15 bg-[#550000]/5 text-[#550000] hover:bg-[#550000]/10 active:bg-[#550000]/15 dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300 dark:hover:bg-[#550000]/30",
  outline:
    "border border-zinc-200 bg-white text-zinc-900 shadow-2xs hover:border-[#550000]/30 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-[#121216] dark:text-zinc-100 dark:hover:border-[#550000]/40 dark:hover:bg-zinc-900/60",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-[#550000]/5 hover:text-[#550000] active:bg-[#550000]/10 dark:text-zinc-300 dark:hover:bg-[#550000]/15 dark:hover:text-red-300",
  destructive:
    "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-500 active:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600",
  gradient:
    "bg-gradient-to-r from-[#550000] to-[#7a0d18] text-white shadow-md shadow-[#550000]/30 hover:from-[#650204] hover:to-[#8c1220] active:from-[#450000] active:to-[#600812]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3 text-xs gap-1.5",
  md: "h-11 rounded-2xl px-4 text-xs font-bold gap-2",
  lg: "h-12 rounded-2xl px-5 text-sm font-bold gap-2.5",
};

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        className,
        variant = "primary",
        size = "md",
        disabled,
        isLoading = false,
        leftIcon,
        rightIcon,
        children,
        type = "button",
        ...props
      },
      ref
    ) => {
      const off = disabled || isLoading;

      return (
        <button
          ref={ref}
          type={type}
          disabled={off}
          className={cn(
            "relative inline-flex items-center justify-center overflow-hidden font-sans font-bold tracking-tight select-none cursor-pointer transform-gpu transition-[background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#550000]/30 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            isLoading && "smart-loading",
            variants[variant],
            sizes[size],
            className
          )}
          {...props}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
          )}
          {children && <span className="truncate">{children}</span>}
          {!isLoading && rightIcon && (
            <span className="shrink-0 flex items-center">{rightIcon}</span>
          )}
        </button>
      );
    }
  )
);

Button.displayName = "Button";

export type { ButtonProps };
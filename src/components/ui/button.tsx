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
    "border border-white/10 bg-[#f5f5f7] text-[#0a0a0c] shadow-sm shadow-black/20 hover:bg-white active:bg-[#dedee3] dark:border-white/10 dark:bg-[#f5f5f7] dark:text-[#0a0a0c] dark:hover:bg-white",
  secondary:
    "border border-[#550000]/30 bg-[#550000]/15 text-red-200 hover:bg-[#550000]/25 active:bg-[#550000]/30 dark:border-[#8c1414]/40 dark:bg-[#550000]/20 dark:text-red-200 dark:hover:bg-[#550000]/30",
  outline:
    "border border-[#22222a] bg-[#121216] text-[#f5f5f7] shadow-none hover:border-[#550000]/50 hover:bg-[#17171c] active:bg-[#0d0d10] dark:border-[#22222a] dark:bg-[#121216] dark:text-[#f5f5f7]",
  ghost:
    "border border-transparent bg-transparent text-[#a2a2ac] hover:bg-white/5 hover:text-[#f5f5f7] active:bg-white/10 dark:text-[#a2a2ac] dark:hover:bg-white/5 dark:hover:text-[#f5f5f7]",
  destructive:
    "border border-rose-900/50 bg-rose-950/40 text-rose-200 shadow-sm shadow-black/20 hover:bg-rose-950/60 active:bg-rose-950/70",
  gradient:
    "border border-[#8c1414]/30 bg-gradient-to-r from-[#550000] to-[#7a0d18] text-white shadow-md shadow-[#550000]/30 hover:from-[#650204] hover:to-[#8c1220] active:from-[#450000] active:to-[#600812]",
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
            "relative inline-flex items-center justify-center overflow-hidden font-sans font-bold tracking-tight select-none cursor-pointer transform-gpu transition-[background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c1414]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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
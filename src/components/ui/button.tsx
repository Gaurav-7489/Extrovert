import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, memo } from "react";
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
    "border border-[rgb(var(--brand-red)/.42)] bg-[rgb(var(--brand-red))] text-white shadow-[0_8px_24px_rgb(var(--brand-red)/.22)] hover:brightness-105 active:brightness-95",
  secondary:
    "border border-[rgb(var(--brand-red)/.22)] bg-[rgb(var(--brand-red)/.11)] text-[rgb(var(--brand-red))] hover:bg-[rgb(var(--brand-red)/.16)]",
  outline:
    "border border-white/[.085] bg-white/[.035] text-zinc-100 shadow-none hover:border-white/15 hover:bg-white/[.06]",
  ghost:
    "border border-transparent bg-transparent text-zinc-400 hover:bg-white/[.045] hover:text-zinc-100",
  destructive:
    "border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
  gradient:
    "border border-white/10 bg-[linear-gradient(135deg,rgb(var(--brand-red)),rgb(225_53_100))] text-white shadow-[0_10px_28px_rgb(var(--brand-red)/.26)] hover:brightness-105",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[13px] px-3 text-[11px] gap-1.5",
  md: "h-11 rounded-[16px] px-4 text-xs gap-2",
  lg: "h-12 rounded-[18px] px-5 text-sm gap-2.5",
};

export const Button = memo(function Button({
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
}: ButtonProps) {
  const off = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={off}
      className={cn(
        "relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden font-sans font-extrabold tracking-[-.01em] transition-[background-color,border-color,box-shadow,transform,filter,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-red)/.42)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080b] active:scale-[0.975] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
        isLoading && "smart-loading",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : leftIcon ? (
        <span className="flex shrink-0 items-center">{leftIcon}</span>
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
      {!isLoading && rightIcon ? (
        <span className="flex shrink-0 items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
});

Button.displayName = "Button";

export type { ButtonProps };

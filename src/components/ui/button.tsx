import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef, memo } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary"|"secondary"|"outline"|"ghost"|"destructive"|"gradient";
type ButtonSize = "sm"|"md"|"lg";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>{variant?:ButtonVariant;size?:ButtonSize;isLoading?:boolean;leftIcon?:React.ReactNode;rightIcon?:React.ReactNode}
const variants:Record<ButtonVariant,string>={
 primary:"border border-transparent bg-[rgb(var(--brand))] text-white shadow-[0_8px_24px_rgb(var(--brand)/.22)] hover:bg-[rgb(var(--brand-hover))] active:bg-[rgb(var(--brand-pressed))]",
 secondary:"border border-[rgb(var(--brand)/.22)] bg-[rgb(var(--brand-soft))] text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand)/.16)] active:bg-[rgb(var(--brand)/.22)]",
 outline:"border border-[rgb(var(--border-color))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-none hover:border-[rgb(var(--brand)/.45)] hover:bg-[rgb(var(--bg-elevated))] active:bg-[rgb(var(--bg-strong))]",
 ghost:"border border-transparent bg-transparent text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-elevated))] hover:text-[rgb(var(--text-primary))] active:bg-[rgb(var(--bg-strong))]",
 destructive:"border border-[rgb(var(--danger)/.26)] bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))] hover:bg-[rgb(var(--danger)/.14)] active:bg-[rgb(var(--danger)/.2)]",
 gradient:"border border-transparent bg-[linear-gradient(135deg,rgb(var(--brand)),rgb(var(--match)))] text-white shadow-[0_10px_28px_rgb(var(--brand)/.2)] hover:brightness-105 active:brightness-95",
};
const sizes:Record<ButtonSize,string>={sm:"h-9 rounded-xl px-3 text-xs gap-1.5",md:"h-11 rounded-xl px-4 text-xs font-bold gap-2",lg:"h-12 rounded-2xl px-5 text-sm font-bold gap-2.5"};
export const Button=memo(forwardRef<HTMLButtonElement,ButtonProps>(({className,variant="primary",size="md",disabled,isLoading=false,leftIcon,rightIcon,children,type="button",...props},ref)=>{const off=disabled||isLoading;return <button ref={ref} type={type} disabled={off} className={cn("relative inline-flex items-center justify-center overflow-hidden font-sans font-bold tracking-tight select-none cursor-pointer transform-gpu transition-[background-color,border-color,box-shadow,transform,opacity,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand)/.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] active:scale-[.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",isLoading&&"smart-loading",variants[variant],sizes[size],className)} {...props}>{isLoading?<Loader2 className="h-4 w-4 shrink-0 animate-spin"/>:(leftIcon&&<span className="flex shrink-0 items-center">{leftIcon}</span>)}{children&&<span className="truncate">{children}</span>}{!isLoading&&rightIcon&&<span className="flex shrink-0 items-center">{rightIcon}</span>}</button>}));
Button.displayName="Button";
export type {ButtonProps};

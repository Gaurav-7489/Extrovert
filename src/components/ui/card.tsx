import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-[1.5rem] border border-[#272C35] bg-[#111318] p-4 font-sans text-[#F5F7FA] shadow-[0_12px_34px_rgba(0,0,0,.18)] transition-[background-color,border-color,box-shadow] duration-150 sm:p-5", className)} {...props}>
    {children}
  </div>
));
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4 space-y-1.5", className)} {...props}>{children}</div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-bold tracking-tight text-[#F5F7FA]", className)} {...props}>{children}</h3>
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs font-normal leading-relaxed text-[#9AA3B2]", className)} {...props}>{children}</p>
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>{children}</div>
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("mt-5 flex items-center justify-between border-t border-[#272C35] pt-4", className)} {...props}>{children}</div>
));
CardFooter.displayName = "CardFooter";

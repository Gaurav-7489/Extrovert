import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "extrovert-surface rounded-[24px] p-4 font-sans text-[#F8F9FC]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4 space-y-1.5", className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-extrabold tracking-[-.025em] text-[#F8F9FC]",
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs leading-relaxed text-[#99A1B0]", className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-5 flex items-center justify-between border-t border-white/[.075] pt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

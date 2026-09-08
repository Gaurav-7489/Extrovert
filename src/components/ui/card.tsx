import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type CardProps=HTMLAttributes<HTMLDivElement>;
export const Card=forwardRef<HTMLDivElement,CardProps>(({className,children,...props},ref)=><div ref={ref} className={cn("rounded-[1.25rem] border border-[rgb(var(--border-color))] bg-[rgb(var(--bg-surface))] p-4 font-sans text-[rgb(var(--text-primary))] shadow-[0_10px_30px_rgb(15_23_42/.06)] transition-[background-color,border-color,box-shadow,transform] duration-150 dark:shadow-[0_14px_34px_rgb(0_0_0/.2)]",className)} {...props}>{children}</div>);
Card.displayName="Card";
export const CardHeader=forwardRef<HTMLDivElement,CardProps>(({className,children,...props},ref)=><div ref={ref} className={cn("mb-4 space-y-1.5",className)} {...props}>{children}</div>);CardHeader.displayName="CardHeader";
export const CardTitle=forwardRef<HTMLHeadingElement,HTMLAttributes<HTMLHeadingElement>>(({className,children,...props},ref)=><h3 ref={ref} className={cn("text-base font-bold tracking-tight text-[rgb(var(--text-primary))]",className)} {...props}>{children}</h3>);CardTitle.displayName="CardTitle";
export const CardDescription=forwardRef<HTMLParagraphElement,HTMLAttributes<HTMLParagraphElement>>(({className,children,...props},ref)=><p ref={ref} className={cn("text-xs font-normal leading-relaxed text-[rgb(var(--text-muted))]",className)} {...props}>{children}</p>);CardDescription.displayName="CardDescription";
export const CardContent=forwardRef<HTMLDivElement,CardProps>(({className,children,...props},ref)=><div ref={ref} className={cn("w-full",className)} {...props}>{children}</div>);CardContent.displayName="CardContent";
export const CardFooter=forwardRef<HTMLDivElement,CardProps>(({className,children,...props},ref)=><div ref={ref} className={cn("mt-5 flex items-center justify-between border-t border-[rgb(var(--border-subtle))] pt-4",className)} {...props}>{children}</div>);CardFooter.displayName="CardFooter";

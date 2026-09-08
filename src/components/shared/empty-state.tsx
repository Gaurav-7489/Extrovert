import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon = "📭", title, description, children, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "my-6 flex flex-col items-center justify-center rounded-[1.75rem] border border-[#272C35] bg-[#111318] p-7 text-center font-sans shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E04A4A]/20 bg-[#32181B] text-xl text-[#F5F7FA]">
        {typeof icon === "string" ? <span aria-hidden="true">{icon}</span> : icon}
      </div>
      <h3 className="text-[17px] font-bold tracking-tight text-[#F5F7FA]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-[#9AA3B2]">{description}</p>
      )}
      {children && <div className="mt-5 flex w-full justify-center">{children}</div>}
    </div>
  );
}

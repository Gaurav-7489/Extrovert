"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield } from "lucide-react";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AppNavbar({isSuperAdmin}:{userEmail:string;isSuperAdmin:boolean}) {
  const pathname = usePathname();
  return <header className="shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-[#0a0a0a]/95"><div className="mx-auto flex h-14 max-w-md items-center justify-between gap-3 px-3.5"><Link href={routes.discover} prefetch className="shrink-0" aria-label="Extrovert home"><BrandLogo/></Link><div className="flex items-center gap-1.5">{isSuperAdmin&&<Link href={routes.admin.root} prefetch className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 text-red-600" aria-label="Admin"><Shield className="h-4 w-4"/></Link>}<Link href={routes.settings} prefetch className={`grid h-9 w-9 place-items-center rounded-xl border ${pathname.startsWith(routes.settings)?"border-red-200 bg-red-50 text-red-600":"border-zinc-200 text-zinc-500"}`} aria-label="Settings"><Settings className="h-4 w-4"/></Link><ThemeToggle compact/></div></div></header>;
}

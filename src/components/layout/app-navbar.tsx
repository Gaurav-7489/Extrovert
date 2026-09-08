"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Settings, Shield } from "lucide-react";
import { routes } from "@/config/routes";
import BrandLogo from "@/components/BrandLogo";

export function AppNavbar({
  userEmail,
  isSuperAdmin,
}: {
  userEmail: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  void userEmail;

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-white/10 bg-[#0a0a0c]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-3.5 sm:px-4">
        <Link href={routes.discover} prefetch className="group flex items-center gap-2 transition-transform active:scale-95" aria-label="Extrovert home"><BrandLogo /></Link>
        <div className="flex items-center gap-2">
          <Link href={routes.premium} prefetch className={`grid h-9 w-9 place-items-center rounded-xl border transition-all active:scale-95 ${pathname.startsWith(routes.premium) ? "border-[#550000] bg-[#550000] text-white shadow-sm shadow-[#550000]/20" : "border-[#550000]/30 bg-[#550000]/15 text-red-300 hover:bg-[#550000]/25"}`} aria-label="Extrovert Premium" title="Extrovert Premium"><Crown className="h-4 w-4" /></Link>
          {isSuperAdmin && <Link href={routes.admin.root} prefetch className="grid h-9 w-9 place-items-center rounded-xl border border-[#550000]/40 bg-[#550000]/20 text-red-300 shadow-2xs transition-all hover:bg-[#550000]/30 active:scale-95" aria-label="Admin Dashboard" title="Admin Dashboard"><Shield className="h-4 w-4" /></Link>}
          <Link href={routes.settings} prefetch className={`grid h-9 w-9 place-items-center rounded-xl border transition-all active:scale-95 ${pathname.startsWith(routes.settings) ? "border-[#550000] bg-[#550000] text-white shadow-sm shadow-[#550000]/20" : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"}`} aria-label="Settings" title="Settings"><Settings className="h-4 w-4" /></Link>
        </div>
      </div>
    </header>
  );
}

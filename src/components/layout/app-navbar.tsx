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

  const premiumActive = pathname.startsWith(routes.premium);
  const settingsActive = pathname.startsWith(routes.settings);

  return (
    <header className="relative z-50 w-full shrink-0 px-3 pt-[max(.55rem,env(safe-area-inset-top))]">
      <div className="relative mx-auto flex h-[54px] w-full items-center justify-between overflow-hidden rounded-[20px] border border-white/[.075] bg-[#09090c]/88 px-2.5 shadow-[0_12px_32px_rgba(0,0,0,.24)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--brand-red)/.34)] to-transparent" />

        <Link
          href={routes.discover}
          prefetch
          className="pressable flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1"
          aria-label="Extrovert home"
        >
          <BrandLogo size={31} />
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={routes.premium}
            prefetch
            className={
              "pressable grid h-9 w-9 place-items-center rounded-[13px] border " +
              (premiumActive
                ? "border-[rgb(var(--brand-red)/.38)] bg-[rgb(var(--brand-red)/.14)] text-[rgb(var(--brand-red))] shadow-[0_0_16px_rgb(var(--brand-red)/.08)]"
                : "border-white/[.065] bg-white/[.025] text-zinc-500")
            }
            aria-label="Extrovert Beyond"
            title="Extrovert Beyond"
          >
            <Crown className="h-[17px] w-[17px]" strokeWidth={2.1} />
          </Link>

          {isSuperAdmin ? (
            <Link
              href={routes.admin.root}
              prefetch
              className="pressable grid h-9 w-9 place-items-center rounded-[13px] border border-white/[.065] bg-white/[.025] text-zinc-500"
              aria-label="Admin dashboard"
              title="Admin dashboard"
            >
              <Shield className="h-[17px] w-[17px]" strokeWidth={2.1} />
            </Link>
          ) : null}

          <Link
            href={routes.settings}
            prefetch
            className={
              "pressable grid h-9 w-9 place-items-center rounded-[13px] border " +
              (settingsActive
                ? "border-white/[.13] bg-white/[.075] text-white"
                : "border-white/[.065] bg-white/[.025] text-zinc-500")
            }
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-[17px] w-[17px]" strokeWidth={2.1} />
          </Link>
        </div>
      </div>
    </header>
  );
}

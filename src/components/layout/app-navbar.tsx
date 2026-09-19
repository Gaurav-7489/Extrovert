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
      <div className="extrovert-glass mx-auto flex h-[54px] w-full items-center justify-between rounded-[20px] px-2.5 shadow-[0_12px_32px_rgba(0,0,0,.2)]">
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
                ? "border-[rgb(var(--brand-red)/.45)] bg-[rgb(var(--brand-red)/.18)] text-[rgb(var(--brand-red))]"
                : "border-white/7 bg-white/[.035] text-zinc-400")
            }
            aria-label="Extrovert Premium"
            title="Extrovert Premium"
          >
            <Crown className="h-[17px] w-[17px]" strokeWidth={2.1} />
          </Link>

          {isSuperAdmin ? (
            <Link
              href={routes.admin.root}
              prefetch
              className="pressable grid h-9 w-9 place-items-center rounded-[13px] border border-white/7 bg-white/[.035] text-zinc-400"
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
                ? "border-white/15 bg-white/10 text-white"
                : "border-white/7 bg-white/[.035] text-zinc-400")
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

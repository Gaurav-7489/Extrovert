"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("extrovert-theme");
    // Default to dark mode unless user explicitly selected "light"
    const next = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("extrovert-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      disabled={!ready}
      className={`relative inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 text-zinc-700 shadow-2xs transition-all duration-150 hover:border-[#550000]/30 hover:bg-[#550000]/5 active:scale-95 disabled:pointer-events-none disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-[#550000]/40 dark:hover:bg-[#550000]/15 ${
        compact ? "h-9 w-9 justify-center p-0" : "px-3 py-2 text-xs font-semibold"
      }`}
    >
      {dark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-[#550000] transition-transform duration-200 rotate-0 scale-100" />
      )}
      {!compact && (
        <span className="text-[11px] font-bold tracking-tight">
          {dark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}

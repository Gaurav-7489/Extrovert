"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("extrovert-theme");
    const next = saved === "dark" || (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
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
      className={`inline-flex items-center gap-2 rounded-2xl border border-border bg-background text-foreground shadow-sm transition hover:border-red-300 hover:bg-red-50/60 disabled:opacity-70 ${compact ? "h-9 w-9 justify-center px-0" : "px-3 py-2"}`}
    >
      {dark ? <Sun className="h-4 w-4 text-red-500" /> : <Moon className="h-4 w-4 text-red-600" />}
      {!compact && <span className="text-[10px] font-black">{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}

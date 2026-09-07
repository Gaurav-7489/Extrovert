"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<"idle" | "launching" | "installed">("idle");
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());
    if (isStandalone()) setStatus("installed");

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setStatus("installed");
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (ios || !deferredPrompt || status === "launching") return;
    setStatus("launching");
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setStatus(choice.outcome === "accepted" ? "installed" : "idle");
    } catch {
      setStatus("idle");
    } finally {
      setDeferredPrompt(null);
    }
  };

  // An installed-state badge used to be rendered by the root layout and could
  // sit on top of app content. Installed state is now represented by Settings.
  if (status === "installed") return null;

  if (ios) {
    return (
      <div className="inline-flex max-w-[250px] items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 px-3 py-2 text-[10px] font-semibold text-zinc-700 shadow-2xs backdrop-blur-md transition-colors dark:border-white/10 dark:bg-[#16161d]/95 dark:text-zinc-300">
        <Share2 className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" />
        <span>Share → Add to Home Screen</span>
      </div>
    );
  }

  if (!deferredPrompt && status !== "launching") return null;

  return (
    <button
      type="button"
      onClick={() => void handleInstallClick()}
      disabled={status === "launching"}
      aria-label="Install DateBu App"
      className="group inline-flex items-center gap-2 rounded-full border border-[#550000]/25 bg-white/95 px-3.5 py-2 text-[10px] font-bold text-[#550000] shadow-2xs backdrop-blur-md transition-all duration-150 hover:bg-[#550000]/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 dark:border-[#550000]/40 dark:bg-[#121216]/95 dark:text-red-300 dark:hover:bg-[#550000]/15"
    >
      {status === "launching" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span>{status === "launching" ? "Opening installer…" : "Install DateBu"}</span>
    </button>
  );
}
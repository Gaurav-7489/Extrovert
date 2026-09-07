"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone, Vibrate } from "lucide-react";
import { InstallPwaButton } from "@/components/shared/install-pwa-button";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

async function syncPushSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  if (!("PushManager" in window) || !("Notification" in window)) return false;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existing.toJSON()),
    });
    if (!response.ok) throw new Error("Couldn't save notification settings.");
    return true;
  }
  const keyResponse = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
  if (!keyResponse.ok) throw new Error("Notification service is unavailable.");
  const { publicKey } = await keyResponse.json();
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const raw = window.atob((publicKey + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const key = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) throw new Error("Couldn't save notification settings.");
  return true;
}

export function DevicePreferences() {
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);

  useEffect(() => {
    const savedHaptics =
      localStorage.getItem("datebu_haptics") ??
      localStorage.getItem("extrovert_date_haptics");
    setHapticsEnabled(savedHaptics !== "off");

    const canNotify =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      window.isSecureContext;
    setStandalone(isStandalone());
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));

    if (canNotify) {
      setNotificationPermission(Notification.permission);
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          setNotificationsEnabled(
            Boolean(subscription) && Notification.permission === "granted"
          );
        })
        .catch(() => undefined);
    } else {
      setNotificationPermission("unsupported");
    }

    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallAvailable(true);
    };
    const handleInstalled = () => {
      setStandalone(true);
      setInstallAvailable(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function toggleHaptics() {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem("datebu_haptics", next ? "on" : "off");
    localStorage.setItem("extrovert_date_haptics", next ? "on" : "off");
    if (next && "vibrate" in navigator) navigator.vibrate(8);
  }

  async function toggleNotifications() {
    if (busy || notificationPermission === "unsupported") return;
    setBusy(true);
    setMessage(null);
    try {
      if (notificationsEnabled) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch("/api/push/unsubscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          if (!response.ok) throw new Error("Couldn't disable notifications.");
          await subscription.unsubscribe();
        }
        setNotificationsEnabled(false);
        setMessage("DateBu notifications are off on this device.");
      } else {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== "granted") {
          setMessage(
            permission === "denied"
              ? "Notifications are blocked by your browser."
              : "Notification permission was not granted."
          );
          return;
        }
        await syncPushSubscription();
        setNotificationsEnabled(true);
        setMessage("DateBu notifications are active for likes, matches, and messages.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Couldn't update DateBu device settings."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216] sm:p-5 font-sans">
      <div>
        <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 sm:text-base">
          DateBu · App &amp; Notifications
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Dating alerts and tactile device feedback on this browser.
        </p>
      </div>

      {/* Push Notifications Row */}
      <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 transition-colors dark:border-white/5 dark:bg-[#16161d]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            {notificationsEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
              Dating notifications
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              {notificationPermission === "unsupported"
                ? "Not supported in this browser"
                : notificationsEnabled
                ? "Likes, matches, and chats notify this device"
                : "Notifications are currently off"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void toggleNotifications()}
          disabled={busy || notificationPermission === "unsupported"}
          className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#550000]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
            notificationsEnabled
              ? "bg-[#550000] dark:bg-red-600"
              : "bg-zinc-300 dark:bg-zinc-700"
          }`}
          aria-label={
            notificationsEnabled
              ? "Turn dating notifications off"
              : "Turn dating notifications on"
          }
          aria-pressed={notificationsEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-zinc-100 ${
              notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Haptics Row */}
      <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 transition-colors dark:border-white/5 dark:bg-[#16161d]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            <Vibrate className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
              Haptics
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              Subtle tactile feedback for likes, swipes, and taps.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleHaptics}
          className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#550000]/30 ${
            hapticsEnabled
              ? "bg-[#550000] dark:bg-red-600"
              : "bg-zinc-300 dark:bg-zinc-700"
          }`}
          aria-label={hapticsEnabled ? "Turn haptics off" : "Turn haptics on"}
          aria-pressed={hapticsEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-zinc-100 ${
              hapticsEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-[#550000]/15 bg-[#550000]/5 px-3 py-2 text-[11px] font-semibold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
          {message}
        </p>
      )}

      {/* PWA / Install Row */}
      <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 transition-colors dark:border-white/5 dark:bg-[#16161d]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
              Install DateBu
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              {standalone
                ? "DateBu is installed on this device"
                : ios
                ? "Tap Share → Add to Home Screen"
                : installAvailable
                ? "Ready to install as a standalone app"
                : "Install availability depends on browser"}
            </p>
          </div>
        </div>

        {standalone ? (
          <span className="shrink-0 rounded-full border border-[#550000]/25 bg-[#550000]/10 px-2.5 py-1 text-[10px] font-bold text-[#550000] shadow-2xs dark:border-[#550000]/40 dark:bg-[#550000]/20 dark:text-red-300">
            Installed
          </span>
        ) : (
          <InstallPwaButton />
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, UserX } from "lucide-react";
import { toggleGhostMode, unblockUser } from "../discover/actions";

interface BlockedProfile {
  id: string;
  display_name: string;
  department: string;
}

export function SettingsControls({
  initialGhostMode,
  blockedUsers: initialBlocked,
  isPro,
}: {
  initialGhostMode: boolean;
  blockedUsers: BlockedProfile[];
  isPro: boolean;
}) {
  const router = useRouter();
  const [ghostMode, setGhostMode] = useState(initialGhostMode);
  const [ghostLoading, setGhostLoading] = useState(false);
  const [ghostError, setGhostError] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState(initialBlocked);
  const [unblockId, setUnblockId] = useState<string | null>(null);

  async function handleGhostMode() {
    if (ghostLoading) return;
    const nextState = !ghostMode;
    setGhostLoading(true);
    setGhostError(null);
    try {
      const result = await toggleGhostMode(nextState);
      if (result.error) {
        setGhostError(result.error);
        return;
      }
      setGhostMode(nextState);
      router.refresh();
    } catch {
      setGhostError("Ghost Mode could not be changed. Please try again.");
    } finally {
      setGhostLoading(false);
    }
  }

  async function handleUnblock(id: string) {
    setUnblockId(id);
    const result = await unblockUser(id);
    setUnblockId(null);
    if (!result.error) {
      setBlockedUsers((current) => current.filter((user) => user.id !== id));
    }
  }

  return (
    <div className="space-y-3.5 font-sans">
      {/* Ghost Mode Privacy Section */}
      <section className="rounded-[1.75rem] border border-[#550000]/20 bg-[#550000]/5 p-4 shadow-2xs transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {ghostMode ? (
                <EyeOff className="h-4 w-4 text-[#550000] dark:text-red-400" />
              ) : (
                <Eye className="h-4 w-4 text-[#550000] dark:text-red-400" />
              )}
              <span>Ghost Mode</span>
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Hide your profile from Discover when you want a break. Your existing matches and chats remain untouched.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGhostMode}
            disabled={ghostLoading || (!isPro && !ghostMode)}
            aria-label={
              ghostMode
                ? "Turn Ghost Mode off"
                : "Unlock DateBu Plus to turn Ghost Mode on"
            }
            aria-pressed={ghostMode}
            className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#550000]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
              ghostMode
                ? "border-[#550000] bg-[#550000] dark:border-red-600 dark:bg-red-600"
                : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
            }`}
          >
            {ghostLoading ? (
              <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
            ) : (
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 dark:bg-zinc-100 ${
                  ghostMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            )}
          </button>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-2xl border border-[#550000]/15 bg-white/80 px-3.5 py-2.5 shadow-2xs backdrop-blur-xs transition-colors dark:border-white/10 dark:bg-[#141419]/90">
          <p className="text-[11px] font-semibold text-[#550000] dark:text-red-300">
            {ghostMode
              ? "Ghost Mode is active · your profile is hidden from Discover."
              : isPro
              ? "Ghost Mode is off · your profile appears to people nearby."
              : "Ghost Mode requires a DateBu Plus subscription."}
          </p>
          {ghostMode ? (
            <EyeOff className="h-4 w-4 shrink-0 text-[#550000] dark:text-red-400" />
          ) : !isPro ? (
            <Lock className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
          ) : null}
        </div>

        {!isPro && !ghostMode && (
          <p className="mt-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            Upgrade to DateBu Plus to browse quietly without showing up in local decks.
          </p>
        )}

        {ghostError && (
          <p
            role="alert"
            className="mt-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-[11px] font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {ghostError}
          </p>
        )}
      </section>

      {/* Blocked Users Section */}
      {blockedUsers.length > 0 && (
        <section className="rounded-[1.75rem] border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216] sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">
            <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Blocked users ({blockedUsers.length})</span>
          </h2>
          <div className="mt-3 space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 transition-colors dark:border-white/5 dark:bg-[#16161d]"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-zinc-950 dark:text-zinc-100">
                    {user.display_name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {user.department}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(user.id)}
                  disabled={unblockId === user.id}
                  className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs transition-all hover:bg-zinc-100 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-[#202028] dark:text-zinc-200 dark:hover:bg-[#282834]"
                >
                  {unblockId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Unblock"
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
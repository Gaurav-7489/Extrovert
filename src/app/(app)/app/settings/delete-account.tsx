"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteAccount } from "../../actions";

export function DeleteAccount() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmation.trim().toLowerCase() === "delete";

  function handleDelete() {
    if (!canDelete || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmation);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace("/login");
    });
  }

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-rose-200/90 bg-rose-50/50 p-4 shadow-2xs transition-colors dark:border-rose-950/60 dark:bg-[#140e10] sm:p-5 font-sans">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 shadow-2xs">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-rose-950 dark:text-rose-200 sm:text-base">
            Delete account
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-800/80 dark:text-rose-300/75">
            Permanently delete your DateBu account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200/80 bg-white/90 p-3.5 shadow-2xs backdrop-blur-xs transition-colors dark:border-rose-900/40 dark:bg-[#121216]/90 sm:p-4">
        <p className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>
            To confirm, type <strong className="font-bold text-rose-700 dark:text-rose-300">delete</strong> below. Your account will be removed only after this exact word is confirmed.
          </span>
        </p>

        <label htmlFor="delete-account-confirmation" className="sr-only">
          Type delete to confirm account deletion
        </label>
        <input
          id="delete-account-confirmation"
          type="text"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setError(null);
          }}
          disabled={isPending}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Type delete"
          className="mt-3 w-full rounded-2xl border border-rose-200/90 bg-white px-3.5 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-[#181820] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-rose-500"
        />

        {error && (
          <p
            role="alert"
            className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || isPending}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/25 transition-all duration-150 hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-700 dark:hover:bg-rose-600"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Deleting account…</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              <span>Permanently delete account</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
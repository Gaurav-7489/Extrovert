"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { removeMatch } from "@/app/(app)/actions";

export function RemoveMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (isPending) return;
    const confirmed = window.confirm(
      "Remove this match? You will both lose access to this chat and the conversation will be removed."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeMatch(matchId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove match"
      title="Remove match"
      className="flex items-center justify-center gap-1 rounded-2xl border border-[#550000]/20 bg-[#550000]/5 py-2 text-[10px] font-bold text-[#550000] shadow-2xs transition-all duration-150 hover:bg-[#550000]/10 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:border-[#550000]/35 dark:bg-[#550000]/15 dark:text-red-300 dark:hover:bg-[#550000]/25"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span>{isPending ? "Removing…" : "Remove"}</span>
    </button>
  );
}
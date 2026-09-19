"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BrowserBackButton({
  fallback,
  label = "Back",
  className = "",
}: {
  fallback: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={className}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}

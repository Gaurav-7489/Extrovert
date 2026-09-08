"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding route error:", error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-white px-5 py-8 font-sans text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
          !
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">
          We couldn&apos;t load onboarding
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          Your account is safe. Try loading this page again. If the problem
          continues, sign out and sign back in.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 h-12 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

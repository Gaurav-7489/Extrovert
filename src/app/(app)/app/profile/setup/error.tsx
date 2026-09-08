"use client";

import { useEffect } from "react";

export default function ProfileSetupError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Profile setup error:", error); }, [error]);
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center justify-center px-5 py-10 text-center font-sans">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-xl text-rose-600">!</div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">Profile setup couldn’t load</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Your profile is safe. Try again, and if it still fails you can return to your profile.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="h-11 rounded-2xl bg-[#550000] px-5 text-xs font-bold text-white">Try again</button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureOwnMessageKey } from "@/lib/crypto/messages";

export function MessageKeyBootstrap({ userId }: { userId: string }) {
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const supabase = createClient();
      void ensureOwnMessageKey(supabase, userId).catch(() => {
        // Chat surfaces show a useful error if a secure key cannot be created.
      });
    };

    // Never compete with the first paint/navigation. The key is only needed
    // when a secure messaging surface is used, so bootstrap it during idle.
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    // Use the global timer API here. This avoids a TypeScript DOM narrowing
    // issue where `window` can become `never` after the feature check above.
    const timer = globalThis.setTimeout(run, 1200);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [userId]);

  return null;
}

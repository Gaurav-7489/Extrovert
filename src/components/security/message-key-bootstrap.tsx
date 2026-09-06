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
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(run, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId]);

  return null;
}

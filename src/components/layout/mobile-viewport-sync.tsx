"use client";

import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--app-viewport-height";

export function MobileViewportSync() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const commit = () => {
      frame = 0;
      const viewport = window.visualViewport;
      const height = Math.round(viewport?.height ?? window.innerHeight);

      if (height > 0) {
        root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
      }
    };

    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(commit);
    };

    sync();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", sync, { passive: true });
    viewport?.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("orientationchange", sync, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty(VIEWPORT_HEIGHT_VAR);
    };
  }, []);

  return null;
}

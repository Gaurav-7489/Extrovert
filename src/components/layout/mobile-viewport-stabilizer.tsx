"use client";

import { useEffect } from "react";

export function MobileViewportStabilizer() {
  useEffect(() => {
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        const height = viewport?.height ?? window.innerHeight;
        const offsetTop = viewport?.offsetTop ?? 0;
        const keyboardInset = Math.max(
          0,
          window.innerHeight - height - offsetTop
        );

        document.documentElement.style.setProperty(
          "--app-height",
          Math.round(height) + "px"
        );
        document.documentElement.style.setProperty(
          "--keyboard-inset",
          Math.round(keyboardInset) + "px"
        );
      });
    };

    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("orientationchange", sync, { passive: true });
    window.visualViewport?.addEventListener("resize", sync, { passive: true });
    window.visualViewport?.addEventListener("scroll", sync, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return null;
}

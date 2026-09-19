"use client";

import { useEffect } from "react";
import { soundFx } from "@/lib/sound";

export function InteractionFeedback() {
  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const target = event.target as HTMLElement | null;
      const control = target?.closest("button, a, [role='button']");
      if (!control || (control as HTMLButtonElement).disabled) return;

      soundFx.playClick();

      const extrovertSetting = localStorage.getItem("extrovert_haptics");
      const legacySetting = localStorage.getItem("datebu_haptics");
      if (extrovertSetting !== "off" && legacySetting !== "off") {
        soundFx.haptic(7);
      }
    };

    document.addEventListener("pointerup", handlePointer, { passive: true });
    return () => document.removeEventListener("pointerup", handlePointer);
  }, []);

  return null;
}

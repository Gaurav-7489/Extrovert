"use client";

import { useEffect } from "react";
import { Lock } from "lucide-react";

export function IdentityFieldsLock({
  values,
}: {
  values: {
    displayName: string;
    dateOfBirth: string;
    gender: string;
    department: string;
    academicYear: string;
  };
}) {
  useEffect(() => {
    const form = document.querySelector("form");
    if (!form) return;
    const fields: Array<[string, string]> = [
      ["display_name", values.displayName],
      ["date_of_birth", values.dateOfBirth],
      ["gender", values.gender],
      ["department", values.department],
      ["academic_year", values.academicYear],
    ];
    const hidden: HTMLInputElement[] = [];
    for (const [name, value] of fields) {
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
      ) {
        if (field instanceof HTMLInputElement) field.readOnly = true;
        else field.disabled = true;
        field.setAttribute("aria-readonly", "true");
        field.classList.add("opacity-60", "cursor-not-allowed");
      }
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
      hidden.push(input);
    }
    return () => hidden.forEach((input) => input.remove());
  }, [values]);

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#550000]/15 bg-[#550000]/5 p-3.5 font-sans transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15 sm:p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#550000]/10 text-[#550000] dark:bg-[#550000]/25 dark:text-red-300">
        <Lock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
          Verified identity is managed by DateBu
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          Name, birthday, gender, and student credentials are locked here to preserve community trust and safety across the platform.
        </p>
      </div>
    </div>
  );
}
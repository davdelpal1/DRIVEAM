import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { CONTROL_CLASS } from "./input";

/** `<select>` nativo con el mismo lenguaje visual que `Input` y un chevron propio. */
export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          CONTROL_CLASS,
          "cursor-pointer appearance-none pr-9",
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

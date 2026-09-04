import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** `<textarea>` con el mismo lenguaje visual que `Input`. */
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg transition-colors outline-none placeholder:text-subtle",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Campo de texto del sistema de componentes. Marca el estado de error con
 * `aria-invalid` (lo ponen los formularios que lo usan).
 */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-black/15 bg-transparent px-3 text-sm transition-colors outline-none",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-white/20",
        "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/25",
        className,
      )}
      {...props}
    />
  );
}

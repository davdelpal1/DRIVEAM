import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const CONTROL_CLASS =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg transition-colors outline-none placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25";

/**
 * Campo de texto del sistema de componentes. Marca el estado de error con
 * `aria-invalid` (lo ponen los formularios que lo usan).
 */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL_CLASS, className)} {...props} />;
}

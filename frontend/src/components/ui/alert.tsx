import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<AlertTone, string> = {
  info: "border-primary/25 bg-primary-weak text-primary-weak-fg",
  success: "border-success/30 bg-success-weak text-success",
  warning: "border-warning/30 bg-warning-weak text-warning",
  danger: "border-danger/30 bg-danger-weak text-danger",
};

export interface AlertProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: AlertTone;
}

/** Banner de estado (error/éxito/aviso/info). Sustituye las cajas de color ad-hoc. */
export function Alert({ tone = "info", className, role, ...props }: AlertProps) {
  return (
    <p
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

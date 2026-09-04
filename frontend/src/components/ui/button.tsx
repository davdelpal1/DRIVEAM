import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg shadow-sm hover:bg-primary-hover disabled:opacity-50",
  secondary:
    "border border-border-strong bg-surface text-fg hover:bg-surface-muted disabled:opacity-50",
  ghost: "text-muted hover:bg-surface-muted hover:text-fg disabled:opacity-50",
  danger:
    "border border-danger/40 text-danger hover:bg-danger-weak disabled:opacity-50",
  accent:
    "bg-accent text-accent-fg shadow-sm hover:brightness-105 disabled:opacity-50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

/** Clases del botón reutilizables desde un `<Link>` o `<a>` sin duplicar estilos. */
export function buttonClass(
  opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = "primary", size = "md", className } = opts;
  return cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Elemento contenedor (p. ej. `"article"` para la tarjeta de candidato). */
  as?: ElementType;
  padded?: boolean;
};

export function Card({
  as: Tag = "div",
  padded = false,
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        padded && "p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold">{children}</h2>;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-border px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

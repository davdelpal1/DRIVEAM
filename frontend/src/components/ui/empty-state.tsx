import type { ReactNode } from "react";

/** Bloque para listas vacías o sin resultados: mensaje centrado + acciones opcionales. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
      {title && <p className="font-medium text-fg">{title}</p>}
      {children && (
        <p className="max-w-md text-sm text-muted">{children}</p>
      )}
      {action && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

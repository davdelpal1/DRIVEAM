import type { ReactNode } from "react";

/**
 * Campo de formulario: label + control + pista/error opcionales.
 * - Sin `htmlFor`: el label envuelve el control (asociación implícita), el patrón
 *   usado en la mayoría de formularios de DRIVEAM.
 * - Con `htmlFor`: label y control van como hermanos; el control (pasado como
 *   `children`) debe llevar ese mismo `id`. Útil cuando el control necesita
 *   `aria-describedby` hacia el error (p. ej. email/contraseña).
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {htmlFor ? (
        <>
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
          {children}
        </>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {label}
          {children}
        </label>
      )}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-xs text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {hint && <p className="-mt-3 text-sm text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

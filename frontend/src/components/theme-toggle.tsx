"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem("driveam-theme", theme);
  } catch {
    // almacenamiento no disponible (privado/bloqueado): el tema no persiste, sin más.
  }
}

/**
 * Alterna claro/oscuro fijando `data-theme` en `<html>` y persistiéndolo. El script
 * inline de `layout.tsx` aplica el valor guardado antes de hidratar para evitar el
 * parpadeo; aquí solo reflejamos el estado inicial y gestionamos el clic.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Lee el tema real solo tras montar en cliente: en el servidor no hay `document` ni
    // `matchMedia`, así que el primer render usa el placeholder de abajo a propósito.
    const current = document.documentElement.dataset.theme as Theme | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con `document`, no con estado de React
    setTheme(
      current === "light" || current === "dark"
        ? current
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    );
  }, []);

  if (theme === null) {
    return <span className="size-9" aria-hidden />;
  }

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className="inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-fg"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
          <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 2.5a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.5 11a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1Zm14 0a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1ZM6.34 6.34a1 1 0 0 1 1.41 0l.71.7a1 1 0 1 1-1.42 1.42l-.7-.71a1 1 0 0 1 0-1.41Zm9.2 9.2a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.42 1.41l-.7-.7a1 1 0 0 1 0-1.42ZM17.66 6.34a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.42l.7-.7a1 1 0 0 1 1.42 0Zm-9.2 9.2a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.42l.7-.7a1 1 0 0 1 1.42 0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
          <path d="M20.4 14.9a8.5 8.5 0 1 1-11.3-11.3 1 1 0 0 1 1.27 1.32A6.5 6.5 0 0 0 19 17.03a1 1 0 0 1 1.32 1.27c-.13.35-.32.68-.55 1Z" />
        </svg>
      )}
    </button>
  );
}

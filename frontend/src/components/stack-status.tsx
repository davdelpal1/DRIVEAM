import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";

interface HealthResponse {
  status: string;
  database: string;
}

interface Indicator {
  label: string;
  ok: boolean;
  detail: string;
}

async function loadIndicators(): Promise<Indicator[]> {
  // El frontend está disponible por el simple hecho de renderizar este componente.
  const frontend: Indicator = {
    label: "Frontend (Next.js)",
    ok: true,
    detail: "renderizando",
  };

  try {
    const health = await apiFetch<HealthResponse>("/health/", {
      cache: "no-store",
    });
    return [
      frontend,
      {
        label: "Backend (Django REST)",
        ok: health.status === "ok",
        detail: `status: ${health.status}`,
      },
      {
        label: "Base de datos (PostgreSQL)",
        ok: health.database === "ok",
        detail: `database: ${health.database}`,
      },
    ];
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error desconocido";
    return [
      frontend,
      { label: "Backend (Django REST)", ok: false, detail },
      {
        label: "Base de datos (PostgreSQL)",
        ok: false,
        detail: "sin respuesta del backend",
      },
    ];
  }
}

export async function StackStatus() {
  const indicators = await loadIndicators();

  return (
    <ul className="w-full divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
      {indicators.map((indicator) => (
        <li
          key={indicator.label}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "size-2.5 rounded-full",
                indicator.ok ? "bg-green-500" : "bg-red-500",
              )}
            />
            <span className="font-medium">{indicator.label}</span>
          </div>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {indicator.ok ? "OK" : "ERROR"} · {indicator.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}

import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <Card>
      <ul className="divide-y divide-border">
        {indicators.map((indicator) => (
          <li
            key={indicator.label}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <span className="font-medium">{indicator.label}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-subtle">
                {indicator.detail}
              </span>
              <Badge variant={indicator.ok ? "success" : "danger"}>
                {indicator.ok ? "OK" : "ERROR"}
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

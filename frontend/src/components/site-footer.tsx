const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-subtle">
        <span>DRIVEAM · busca, guarda, compara y evalúa coches de ocasión.</span>
        <div className="flex flex-wrap gap-4">
          <a
            href={`${API_BASE_URL}/api/v1/schema/swagger-ui/`}
            className="hover:text-fg hover:underline"
          >
            Documentación de la API
          </a>
          <a href="/estado" className="hover:text-fg hover:underline">
            Estado del sistema
          </a>
        </div>
      </div>
    </footer>
  );
}

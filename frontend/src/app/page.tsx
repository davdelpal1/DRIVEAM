import Link from "next/link";
import { Suspense } from "react";

import { StackStatus } from "@/components/stack-status";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">DRIVEAM</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Busca, guarda, compara y evalúa vehículos de ocasión de distintas
          fuentes.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Estado del stack · FASE 0
        </h2>
        <Suspense
          fallback={
            <p className="text-sm text-zinc-500">Comprobando servicios…</p>
          }
        >
          <StackStatus />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Dominio · FASE 1
        </h2>
        <Link className="underline underline-offset-4" href="/catalogo">
          Ver el catálogo de vehículos y anuncios
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Cuenta · FASE 2
        </h2>
        <Link className="underline underline-offset-4" href="/registro">
          Crear una cuenta y guardar tus preferencias de compra
        </Link>
      </section>

      <footer className="text-sm text-zinc-500 dark:text-zinc-400">
        API:{" "}
        <a
          className="underline underline-offset-4"
          href={`${API_BASE_URL}/api/v1/schema/swagger-ui/`}
        >
          documentación OpenAPI
        </a>
      </footer>
    </main>
  );
}

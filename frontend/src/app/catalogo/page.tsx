import { Suspense } from "react";

import { VehicleList } from "@/features/catalog/vehicle-list";

export const metadata = {
  title: "Catálogo · DRIVEAM",
  description: "Vehículos normalizados y sus anuncios.",
};

export default function CatalogoPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Cada vehículo normalizado con los anuncios que lo ofrecen. FASE 1.
        </p>
      </header>

      <Suspense
        fallback={<p className="text-sm text-zinc-500">Cargando catálogo…</p>}
      >
        <VehicleList />
      </Suspense>
    </main>
  );
}

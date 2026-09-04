import { Suspense } from "react";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleList } from "@/features/catalog/vehicle-list";

export const metadata = {
  title: "Catálogo · DRIVEAM",
  description: "Vehículos normalizados y sus anuncios.",
};

export default function CatalogoPage() {
  return (
    <Container>
      <PageHeader
        title="Catálogo"
        description="Cada vehículo normalizado con los anuncios que lo ofrecen."
      />

      <Suspense
        fallback={<p className="text-sm text-muted">Cargando catálogo…</p>}
      >
        <VehicleList />
      </Suspense>
    </Container>
  );
}

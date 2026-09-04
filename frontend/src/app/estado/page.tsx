import { Suspense } from "react";

import { Container } from "@/components/container";
import { StackStatus } from "@/components/stack-status";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Estado del sistema · DRIVEAM",
  description: "Comprobación en vivo del frontend, la API y la base de datos.",
};

export default function EstadoPage() {
  return (
    <Container size="narrow">
      <PageHeader
        title="Estado del sistema"
        description="Comprobación en vivo de los servicios que componen DRIVEAM."
      />
      <Suspense
        fallback={<p className="text-sm text-muted">Comprobando servicios…</p>}
      >
        <StackStatus />
      </Suspense>
    </Container>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CandidateDashboard } from "@/features/candidates/candidate-dashboard";
import type { Candidate } from "@/features/candidates/types";
import type { Paginated } from "@/lib/api";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Mis coches · DRIVEAM",
  description:
    "Gestiona todos los coches que estás valorando desde una pantalla.",
};

export default async function CandidatosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const page = await serverApiGet<Paginated<Candidate>>("/candidates/");

  return (
    <Container size="wide">
      <PageHeader
        title="Mis coches"
        description="Gestiona toda tu búsqueda desde aquí: filtra, ordena y cambia el estado de seguimiento de cada candidato."
        actions={
          <>
            <Link
              href="/candidatos/importar"
              className={buttonClass({ variant: "secondary" })}
            >
              Importar por URL
            </Link>
            <Link href="/candidatos/nuevo" className={buttonClass()}>
              Nuevo candidato
            </Link>
          </>
        }
      />

      {page ? (
        <CandidateDashboard candidates={page.results} />
      ) : (
        <Alert tone="danger">
          No se pudieron cargar tus candidatos. Recarga la página.
        </Alert>
      )}
    </Container>
  );
}

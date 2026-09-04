import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/features/import/import-wizard";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Importar por URL · DRIVEAM",
  description: "Añade un candidato pegando el enlace de un anuncio.",
};

export default async function ImportarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <Container>
      <PageHeader
        title="Importar por URL"
        description={
          <>
            Pega el enlace de un anuncio y DRIVEAM intentará rellenar los
            datos por ti. Podrás revisarlos antes de guardar. ¿Prefieres
            teclearlos?{" "}
            <Link
              href="/candidatos/nuevo"
              className="font-medium text-primary hover:underline"
            >
              Alta manual
            </Link>
            .
          </>
        }
      />
      <ImportWizard />
    </Container>
  );
}

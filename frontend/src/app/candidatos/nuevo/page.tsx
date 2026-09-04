import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui/page-header";
import { CandidateForm } from "@/features/candidates/candidate-form";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Nuevo candidato · DRIVEAM",
  description: "Añade un coche a mano.",
};

export default async function NuevoCandidatoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <Container>
      <PageHeader
        title="Nuevo candidato"
        description={
          <>
            Solo marca y modelo son obligatorios. Lo demás lo puedes completar
            luego. ¿Tienes el enlace del anuncio?{" "}
            <Link
              href="/candidatos/importar"
              className="font-medium text-primary hover:underline"
            >
              Impórtalo por URL
            </Link>
            .
          </>
        }
      />
      <CandidateForm />
    </Container>
  );
}

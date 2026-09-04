import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui/page-header";
import { CandidateForm } from "@/features/candidates/candidate-form";
import type { Candidate } from "@/features/candidates/types";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Editar candidato · DRIVEAM",
  description: "Actualiza los datos de un candidato.",
};

export default async function EditarCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { id } = await params;
  const candidate = await serverApiGet<Candidate>(`/candidates/${id}/`);
  if (!candidate) notFound();

  return (
    <Container>
      <PageHeader
        title="Editar candidato"
        description={
          <>
            {candidate.make} {candidate.model} ·{" "}
            <Link
              href={`/candidatos/${candidate.id}/financiacion`}
              className="font-medium text-primary hover:underline"
            >
              Calcular financiación
            </Link>
          </>
        }
      />
      <CandidateForm initialCandidate={candidate} />
    </Container>
  );
}

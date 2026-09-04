import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui/page-header";
import type { Candidate } from "@/features/candidates/types";
import { FinanceForm } from "@/features/finance/finance-form";
import type { FinanceOffer } from "@/features/finance/types";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Financiación · DRIVEAM",
  description: "Calcula el coste real de financiar un candidato.",
};

export default async function FinanciacionCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { id } = await params;
  const candidate = await serverApiGet<Candidate>(`/candidates/${id}/`);
  if (!candidate) notFound();

  const offer = await serverApiGet<FinanceOffer>(`/candidates/${id}/finance/`);

  return (
    <Container size="wide">
      <PageHeader
        title="Financiación"
        description={
          <>
            {candidate.make} {candidate.model}
            {candidate.version ? ` ${candidate.version}` : ""} ·{" "}
            <Link
              href={`/candidatos/${candidate.id}/editar`}
              className="font-medium text-primary hover:underline"
            >
              Ver ficha
            </Link>
          </>
        }
      />
      <FinanceForm candidate={candidate} initialOffer={offer} />
    </Container>
  );
}

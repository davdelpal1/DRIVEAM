import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { Candidate } from "@/features/candidates/types";
import { ScoreBreakdownPanel } from "@/features/scoring/score-breakdown";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Car Score · DRIVEAM",
  description: "Por qué este candidato obtiene esa puntuación.",
};

export default async function ScoreCandidatoPage({
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
        title="Car Score"
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
            {" · "}
            <Link
              href={`/candidatos/${candidate.id}/financiacion`}
              className="font-medium text-primary hover:underline"
            >
              Financiación
            </Link>
          </>
        }
      />

      {candidate.score_breakdown ? (
        <ScoreBreakdownPanel breakdown={candidate.score_breakdown} />
      ) : (
        <EmptyState title="El Car Score aún no está disponible para este candidato" />
      )}

      <p className="border-t border-border pt-4 text-xs text-subtle">
        El Car Score es una ayuda a la decisión, no una verdad absoluta. Ajusta
        el peso de cada factor en{" "}
        <Link href="/perfil" className="font-medium text-primary hover:underline">
          tus preferencias
        </Link>
        .
      </p>
    </Container>
  );
}

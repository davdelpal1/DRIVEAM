import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  MAX_COMPARE,
  MIN_COMPARE,
  parseCompareIds,
} from "@/features/candidates/comparison";
import { ComparisonTable } from "@/features/candidates/comparison-table";
import type { Candidate } from "@/features/candidates/types";
import type { Paginated } from "@/lib/api";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Comparar coches · DRIVEAM",
  description: "Compara entre 2 y 5 candidatos lado a lado.",
};

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { ids } = await searchParams;
  const wanted = parseCompareIds(ids);
  const page = await serverApiGet<Paginated<Candidate>>("/candidates/");
  const all = page?.results ?? [];
  const selected = wanted
    .map((id) => all.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => candidate !== undefined)
    .slice(0, MAX_COMPARE);

  return (
    <Container size="wide">
      <PageHeader
        title="Comparar coches"
        description={
          <>
            Marca entre {MIN_COMPARE} y {MAX_COMPARE} candidatos en{" "}
            <Link href="/candidatos" className="font-medium text-primary hover:underline">
              Mis coches
            </Link>{" "}
            y compáralos aquí.
          </>
        }
      />

      {page === null ? (
        <Alert tone="danger">
          No se pudieron cargar tus candidatos. Recarga la página.
        </Alert>
      ) : selected.length < MIN_COMPARE ? (
        <EmptyState title={`Elige al menos ${MIN_COMPARE} candidatos para comparar`}>
          Vuelve a{" "}
          <Link href="/candidatos" className="font-medium text-primary hover:underline">
            Mis coches
          </Link>{" "}
          y usa las casillas &quot;Comparar&quot; de cada tarjeta.
        </EmptyState>
      ) : (
        <ComparisonTable candidates={selected} />
      )}

      <Link href="/candidatos" className="text-sm font-medium text-primary hover:underline">
        ← Volver a Mis coches
      </Link>
    </Container>
  );
}

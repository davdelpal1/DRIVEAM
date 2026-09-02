import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Financiación</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {candidate.make} {candidate.model}
          {candidate.version ? ` ${candidate.version}` : ""} ·{" "}
          <Link
            href={`/candidatos/${candidate.id}/editar`}
            className="underline underline-offset-4"
          >
            Ver ficha
          </Link>
        </p>
      </header>
      <FinanceForm candidate={candidate} initialOffer={offer} />
    </main>
  );
}

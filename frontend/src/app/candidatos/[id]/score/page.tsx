import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Car Score</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {candidate.make} {candidate.model}
          {candidate.version ? ` ${candidate.version}` : ""} ·{" "}
          <Link
            href={`/candidatos/${candidate.id}/editar`}
            className="underline underline-offset-4"
          >
            Ver ficha
          </Link>
          {" · "}
          <Link
            href={`/candidatos/${candidate.id}/financiacion`}
            className="underline underline-offset-4"
          >
            Financiación
          </Link>
        </p>
      </header>

      {candidate.score_breakdown ? (
        <ScoreBreakdownPanel breakdown={candidate.score_breakdown} />
      ) : (
        <p className="rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          El Car Score aún no está disponible para este candidato.
        </p>
      )}

      <p className="border-t border-black/10 pt-4 text-xs text-zinc-400 dark:border-white/10">
        El Car Score es una ayuda a la decisión, no una verdad absoluta. Ajusta el
        peso de cada factor en{" "}
        <Link href="/perfil" className="underline underline-offset-4">
          tus preferencias
        </Link>
        .
      </p>
    </main>
  );
}

import { notFound, redirect } from "next/navigation";

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Editar candidato
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {candidate.make} {candidate.model}
        </p>
      </header>
      <CandidateForm initialCandidate={candidate} />
    </main>
  );
}

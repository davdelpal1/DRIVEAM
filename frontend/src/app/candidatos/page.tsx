import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Mis coches</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gestiona toda tu búsqueda desde aquí: filtra, ordena y cambia el
            estado de seguimiento de cada candidato.
          </p>
        </div>
        <Link
          href="/candidatos/nuevo"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Nuevo candidato
        </Link>
      </header>

      {page ? (
        <CandidateDashboard candidates={page.results} />
      ) : (
        <p className="rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          No se pudieron cargar tus candidatos. Recarga la página.
        </p>
      )}
    </main>
  );
}

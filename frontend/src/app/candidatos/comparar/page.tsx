import Link from "next/link";
import { redirect } from "next/navigation";

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

const noticeClass =
  "rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400";

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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Comparar coches</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Marca entre {MIN_COMPARE} y {MAX_COMPARE} candidatos en{" "}
          <Link href="/candidatos" className="underline underline-offset-4">
            Mis coches
          </Link>{" "}
          y compáralos aquí.
        </p>
      </header>

      {page === null ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          No se pudieron cargar tus candidatos. Recarga la página.
        </p>
      ) : selected.length < MIN_COMPARE ? (
        <p className={noticeClass}>
          Elige al menos {MIN_COMPARE} candidatos para comparar. Vuelve a{" "}
          <Link href="/candidatos" className="underline underline-offset-4">
            Mis coches
          </Link>{" "}
          y usa las casillas &quot;Comparar&quot; de cada tarjeta.
        </p>
      ) : (
        <ComparisonTable candidates={selected} />
      )}

      <Link
        href="/candidatos"
        className="text-sm text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
      >
        ← Volver a Mis coches
      </Link>
    </main>
  );
}

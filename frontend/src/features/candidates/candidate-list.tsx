"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  archiveCandidate,
  deleteCandidate,
  favoriteCandidate,
  unarchiveCandidate,
  unfavoriteCandidate,
} from "./api";
import type { Candidate } from "./types";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-ES");

function priceLabel(value: string | null): string {
  return value === null ? "precio no indicado" : eur.format(Number(value));
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const meta = [
    candidate.year,
    candidate.mileage_km !== null
      ? `${decimal.format(candidate.mileage_km)} km`
      : null,
    candidate.fuel_type !== "desconocido" ? candidate.fuel_type : null,
    candidate.seller_name || null,
  ].filter(Boolean);

  return (
    <article
      className={`rounded-xl border border-black/10 dark:border-white/15 ${
        candidate.is_archived ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h3 className="font-semibold">
          {candidate.make} {candidate.model}
          {candidate.version ? (
            <span className="font-normal text-zinc-500">
              {" "}
              {candidate.version}
            </span>
          ) : null}
        </h3>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {priceLabel(candidate.price_cash)}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          {meta.length ? meta.join(" · ") : "Sin datos adicionales"}
          {candidate.is_favorite ? " · ★ favorito" : ""}
          {candidate.is_archived ? " · archivado" : ""}
        </p>
        {candidate.notes ? (
          <p className="whitespace-pre-line text-zinc-500">{candidate.notes}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/candidatos/${candidate.id}/editar`}
            className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Editar
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                candidate.is_favorite
                  ? unfavoriteCandidate(candidate.id)
                  : favoriteCandidate(candidate.id),
              )
            }
            className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            {candidate.is_favorite ? "Quitar favorito" : "Favorito"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                candidate.is_archived
                  ? unarchiveCandidate(candidate.id)
                  : archiveCandidate(candidate.id),
              )
            }
            className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            {candidate.is_archived ? "Desarchivar" : "Archivar"}
          </button>
          {candidate.url ? (
            <a
              href={candidate.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Ver anuncio
            </a>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar "${candidate.make} ${candidate.model}"? No se puede deshacer.`,
                )
              ) {
                void run(() => deleteCandidate(candidate.id));
              }
            }}
            className="rounded-full border border-red-500/40 px-3 py-1 font-medium text-red-700 hover:bg-red-500/5 disabled:opacity-50 dark:text-red-400"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

export function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const visible = candidates.filter((c) => showArchived || !c.is_archived);
  const archivedCount = candidates.filter((c) => c.is_archived).length;

  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Todavía no has añadido ningún candidato. Empieza con{" "}
        <Link href="/candidatos/nuevo" className="underline underline-offset-4">
          Nuevo candidato
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {archivedCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            className="size-4"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Mostrar archivados ({archivedCount})
        </label>
      )}
      {visible.map((candidate) => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
}

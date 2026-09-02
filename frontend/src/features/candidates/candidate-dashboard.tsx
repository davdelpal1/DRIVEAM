"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  archiveCandidate,
  deleteCandidate,
  favoriteCandidate,
  setCandidateStatus,
  unarchiveCandidate,
  unfavoriteCandidate,
} from "./api";
import { MAX_COMPARE, MIN_COMPARE } from "./comparison";
import {
  applyFilters,
  EMPTY_FILTERS,
  SORT_OPTIONS,
  sortCandidates,
  type DashboardFilters,
  type SortKey,
} from "./dashboard-filters";
import {
  FUEL_TYPE_OPTIONS,
  TRACKING_STATUS_OPTIONS,
  type Candidate,
} from "./types";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-ES");

function priceLabel(value: string | null): string {
  return value === null ? "precio no indicado" : eur.format(Number(value));
}

const selectClass =
  "h-9 rounded-lg border border-black/15 bg-transparent px-2 text-sm dark:border-white/20";
const inputClass =
  "h-9 w-full rounded-lg border border-black/15 bg-transparent px-2 text-sm dark:border-white/20";

function CandidateCard({
  candidate,
  selected,
  selectionFull,
  onToggleSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  selectionFull: boolean;
  onToggleSelect: () => void;
}) {
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
    candidate.source_label,
  ].filter(Boolean);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/15 ${
        candidate.is_archived ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-28 items-center justify-center bg-black/5 text-3xl font-semibold text-zinc-400 dark:bg-white/10">
        {candidate.make.slice(0, 1).toUpperCase()}
        {candidate.is_favorite ? (
          <span className="ml-2 text-amber-500" aria-hidden>
            ★
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between gap-x-3">
          <h3 className="font-semibold">
            {candidate.make} {candidate.model}
            {candidate.version ? (
              <span className="font-normal text-zinc-500">
                {" "}
                {candidate.version}
              </span>
            ) : null}
          </h3>
          <span className="shrink-0 text-zinc-600 dark:text-zinc-400">
            {priceLabel(candidate.price_cash)}
          </span>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400">
          {meta.length ? meta.join(" · ") : "Sin datos adicionales"}
          {" · "}
          Score {candidate.score ?? "—"}
          {candidate.is_favorite ? " · ★ favorito" : ""}
          {candidate.is_archived ? " · archivado" : ""}
        </p>

        {candidate.notes ? (
          <p className="whitespace-pre-line text-zinc-500">{candidate.notes}</p>
        ) : null}

        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            className="size-4"
            checked={selected}
            disabled={!selected && selectionFull}
            onChange={onToggleSelect}
          />
          Comparar
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Estado
          <select
            className={selectClass}
            disabled={busy}
            value={candidate.tracking_status}
            onChange={(event) =>
              run(() => setCandidateStatus(candidate.id, event.target.value))
            }
          >
            {TRACKING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Link
            href={`/candidatos/${candidate.id}/editar`}
            className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Editar
          </Link>
          <Link
            href={`/candidatos/${candidate.id}/financiacion`}
            className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Financiación
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

export function CandidateDashboard({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("created_desc");
  const [selected, setSelected] = useState<number[]>([]);

  function patch(part: Partial<DashboardFilters>) {
    setFilters((prev) => ({ ...prev, ...part }));
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  const visible = useMemo(
    () => sortCandidates(applyFilters(candidates, filters), sort),
    [candidates, filters, sort],
  );
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Precio máximo (€)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className={inputClass}
              value={filters.priceMax}
              onChange={(event) => patch({ priceMax: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Año mínimo
            <input
              type="number"
              inputMode="numeric"
              min={1900}
              className={inputClass}
              value={filters.yearMin}
              onChange={(event) => patch({ yearMin: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Kilómetros máximo
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className={inputClass}
              value={filters.mileageMax}
              onChange={(event) => patch({ mileageMax: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Combustible
            <select
              className={inputClass}
              value={filters.fuelType}
              onChange={(event) => patch({ fuelType: event.target.value })}
            >
              <option value="">Todos</option>
              {FUEL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Filtrar por estado
            <select
              className={inputClass}
              value={filters.trackingStatus}
              onChange={(event) =>
                patch({ trackingStatus: event.target.value })
              }
            >
              <option value="">Todos</option>
              {TRACKING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Ordenar por
            <select
              className={inputClass}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={filters.onlyFavorites}
              onChange={(event) =>
                patch({ onlyFavorites: event.target.checked })
              }
            />
            Solo favoritos
          </label>
          {archivedCount > 0 && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={filters.showArchived}
                onChange={(event) =>
                  patch({ showArchived: event.target.checked })
                }
              />
              Mostrar archivados ({archivedCount})
            </label>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {visible.length} de {candidates.length}{" "}
        {candidates.length === 1 ? "candidato" : "candidatos"}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Ningún candidato coincide con los filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={selected.includes(candidate.id)}
              selectionFull={selected.length >= MAX_COMPARE}
              onToggleSelect={() => toggleSelect(candidate.id)}
            />
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-background/95 p-3 text-sm shadow-lg backdrop-blur dark:border-white/15">
          <span className="text-zinc-600 dark:text-zinc-400">
            {selected.length}{" "}
            {selected.length === 1 ? "seleccionado" : "seleccionados"} para
            comparar (máx. {MAX_COMPARE})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Limpiar
            </button>
            {selected.length >= MIN_COMPARE ? (
              <Link
                href={`/candidatos/comparar?ids=${selected.join(",")}`}
                className="rounded-full bg-foreground px-3 py-1 font-medium text-background hover:opacity-90"
              >
                Comparar ({selected.length})
              </Link>
            ) : (
              <span className="rounded-full border border-black/15 px-3 py-1 text-zinc-400 dark:border-white/20">
                Elige {MIN_COMPARE}+ para comparar
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

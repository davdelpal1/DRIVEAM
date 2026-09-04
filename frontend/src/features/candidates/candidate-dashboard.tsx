"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Stat } from "@/components/ui/stat";
import { ScoreBadge } from "@/features/scoring/score-badge";

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

const filterLabelClass = "flex flex-col gap-1.5 text-xs font-medium text-muted";

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

  const specs = [
    candidate.year ? String(candidate.year) : null,
    candidate.mileage_km !== null
      ? `${decimal.format(candidate.mileage_km)} km`
      : null,
    candidate.fuel_type !== "desconocido" ? candidate.fuel_type : null,
  ].filter((value): value is string => value !== null);

  return (
    <Card
      as="article"
      className={candidate.is_archived ? "opacity-60" : ""}
    >
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {candidate.make} {candidate.model}
              {candidate.version ? (
                <span className="font-normal text-muted"> {candidate.version}</span>
              ) : null}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {specs.map((spec) => (
                <Badge key={spec}>{spec}</Badge>
              ))}
              <Badge variant="neutral">{candidate.source_label}</Badge>
              {candidate.is_favorite && <Badge variant="warning">★ favorito</Badge>}
              {candidate.is_archived && <Badge variant="neutral">archivado</Badge>}
            </div>
          </div>
          <span className="tnum shrink-0 font-semibold">
            {priceLabel(candidate.price_cash)}
          </span>
        </div>

        <Link
          href={`/candidatos/${candidate.id}/score`}
          className="flex w-fit items-center gap-2 rounded-md px-1.5 py-1 -ml-1.5 hover:bg-surface-muted"
          title={candidate.score_breakdown?.label ?? "Ver el Car Score"}
        >
          <span className="text-xs font-medium text-subtle">Car Score</span>
          <ScoreBadge score={candidate.score} label="" compact />
        </Link>

        {candidate.notes ? (
          <p className="line-clamp-2 text-sm whitespace-pre-line text-muted">
            {candidate.notes}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected}
              disabled={!selected && selectionFull}
              onChange={onToggleSelect}
            />
            Comparar
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-muted">
            Estado
            <Select
              className="h-8 text-xs"
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
            </Select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Link
            href={`/candidatos/${candidate.id}/editar`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            Editar
          </Link>
          <Link
            href={`/candidatos/${candidate.id}/financiacion`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            Financiación
          </Link>
          <Link
            href={`/candidatos/${candidate.id}/score`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            Score
          </Link>
          {candidate.url ? (
            <a
              href={candidate.url}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Ver anuncio
            </a>
          ) : null}
          <span className="grow" />
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(() =>
                candidate.is_favorite
                  ? unfavoriteCandidate(candidate.id)
                  : favoriteCandidate(candidate.id),
              )
            }
          >
            {candidate.is_favorite ? "Quitar favorito" : "Favorito"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(() =>
                candidate.is_archived
                  ? unarchiveCandidate(candidate.id)
                  : archiveCandidate(candidate.id),
              )
            }
          >
            {candidate.is_archived ? "Desarchivar" : "Archivar"}
          </Button>
          <Button
            variant="danger"
            size="sm"
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
          >
            Eliminar
          </Button>
        </div>
      </CardBody>
    </Card>
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
  const favoriteCount = candidates.filter((c) => c.is_favorite).length;
  const scored = candidates.filter((c) => c.score !== null);
  const bestScore = scored.length
    ? Math.max(...scored.map((c) => c.score!))
    : null;

  if (candidates.length === 0) {
    return (
      <EmptyState title="Todavía no has añadido ningún candidato">
        Empieza con{" "}
        <Link href="/candidatos/nuevo" className="font-medium text-primary hover:underline">
          Nuevo candidato
        </Link>{" "}
        o{" "}
        <Link href="/candidatos/importar" className="font-medium text-primary hover:underline">
          Importar por URL
        </Link>
        .
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
        <Stat label="Candidatos" value={String(candidates.length)} />
        <Stat label="Favoritos" value={String(favoriteCount)} tone="primary" />
        <Stat
          label="Mejor score"
          value={bestScore === null ? "—" : String(bestScore)}
          tone="success"
        />
      </div>

      <Card padded>
        <CardBody className="flex flex-col gap-4 p-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={filterLabelClass}>
              Precio máximo (€)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm outline-none focus-visible:border-primary"
                value={filters.priceMax}
                onChange={(event) => patch({ priceMax: event.target.value })}
              />
            </label>
            <label className={filterLabelClass}>
              Año mínimo
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm outline-none focus-visible:border-primary"
                value={filters.yearMin}
                onChange={(event) => patch({ yearMin: event.target.value })}
              />
            </label>
            <label className={filterLabelClass}>
              Kilómetros máximo
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm outline-none focus-visible:border-primary"
                value={filters.mileageMax}
                onChange={(event) => patch({ mileageMax: event.target.value })}
              />
            </label>
            <label className={filterLabelClass}>
              Combustible
              <Select
                className="h-9 text-sm"
                value={filters.fuelType}
                onChange={(event) => patch({ fuelType: event.target.value })}
              >
                <option value="">Todos</option>
                {FUEL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className={filterLabelClass}>
              Filtrar por estado
              <Select
                className="h-9 text-sm"
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
              </Select>
            </label>
            <label className={filterLabelClass}>
              Ordenar por
              <Select
                className="h-9 text-sm"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm text-muted">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
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
                  className="size-4 accent-primary"
                  checked={filters.showArchived}
                  onChange={(event) =>
                    patch({ showArchived: event.target.checked })
                  }
                />
                Mostrar archivados ({archivedCount})
              </label>
            )}
          </div>
        </CardBody>
      </Card>

      <p className="text-sm text-muted">
        {visible.length} de {candidates.length}{" "}
        {candidates.length === 1 ? "candidato" : "candidatos"}
      </p>

      {visible.length === 0 ? (
        <EmptyState title="Ningún candidato coincide con los filtros" />
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
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 p-3 text-sm shadow-lg backdrop-blur">
          <span className="text-muted">
            {selected.length}{" "}
            {selected.length === 1 ? "seleccionado" : "seleccionados"} para
            comparar (máx. {MAX_COMPARE})
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelected([])}>
              Limpiar
            </Button>
            {selected.length >= MIN_COMPARE ? (
              <Link
                href={`/candidatos/comparar?ids=${selected.join(",")}`}
                className={buttonClass({ size: "sm" })}
              >
                Comparar ({selected.length})
              </Link>
            ) : (
              <span className="rounded-md border border-border-strong px-3 py-1 text-subtle">
                Elige {MIN_COMPARE}+ para comparar
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

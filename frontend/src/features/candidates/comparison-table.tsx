import Link from "next/link";

import { bestIds, COMPARISON_ROWS } from "./comparison";
import type { Candidate } from "./types";

const cellClass = "min-w-40 border-t border-black/10 p-2 align-top dark:border-white/15";
const headColClass =
  "sticky left-0 z-10 bg-background p-2 text-left align-top text-xs font-medium uppercase tracking-wide text-zinc-500";
const bestClass = "font-semibold text-emerald-700 dark:text-emerald-400";

/**
 * Tabla comparativa: una columna por candidato, primera columna fija (sticky) en horizontal.
 * En móvil la tabla hace scroll dentro de su contenedor. El valor que gana cada criterio se
 * resalta y lleva su indicador ("Menor precio", "Menos km", …).
 */
export function ComparisonTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background p-2" />
            {candidates.map((candidate) => (
              <th
                key={candidate.id}
                className="min-w-40 p-2 text-left align-bottom"
              >
                <div className="flex h-16 items-center justify-center rounded-lg bg-black/5 text-2xl font-semibold text-zinc-400 dark:bg-white/10">
                  {candidate.make.slice(0, 1).toUpperCase()}
                </div>
                <div className="mt-2 font-semibold">
                  {candidate.make} {candidate.model}
                </div>
                {candidate.version ? (
                  <div className="font-normal text-zinc-500">
                    {candidate.version}
                  </div>
                ) : null}
                <Link
                  href={`/candidatos/${candidate.id}/editar`}
                  className="text-xs font-normal text-zinc-500 underline underline-offset-4"
                >
                  Ver ficha
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => {
            const winners = bestIds(candidates, row);
            return (
              <tr key={row.key}>
                <th scope="row" className={headColClass}>
                  {row.label}
                </th>
                {candidates.map((candidate) => {
                  const isBest = winners.has(candidate.id);
                  return (
                    <td
                      key={candidate.id}
                      className={`${cellClass} ${isBest ? bestClass : ""}`}
                    >
                      {row.format(candidate)}
                      {isBest && row.badge ? (
                        <span className="ml-1 whitespace-nowrap rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          {row.badge}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <th scope="row" className={headColClass}>
              Anuncio
            </th>
            {candidates.map((candidate) => (
              <td key={candidate.id} className={cellClass}>
                {candidate.url ? (
                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    Abrir
                  </a>
                ) : (
                  "—"
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

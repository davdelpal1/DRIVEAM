import Link from "next/link";

import { bestIds, COMPARISON_ROWS } from "./comparison";
import type { Candidate } from "./types";

const cellClass = "min-w-40 border-t border-border p-3 align-top";
const headColClass =
  "sticky left-0 z-10 bg-surface p-3 text-left align-top text-xs font-medium tracking-wide text-subtle uppercase";
const bestClass = "font-semibold text-success";

/**
 * Tabla comparativa: una columna por candidato, primera columna fija (sticky) en horizontal.
 * En móvil la tabla hace scroll dentro de su contenedor. El valor que gana cada criterio se
 * resalta y lleva su indicador ("Menor precio", "Menos km", …).
 */
export function ComparisonTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface" />
            {candidates.map((candidate) => (
              <th key={candidate.id} className="min-w-40 p-3 text-left align-bottom">
                <div className="font-semibold">
                  {candidate.make} {candidate.model}
                </div>
                {candidate.version ? (
                  <div className="font-normal text-muted">{candidate.version}</div>
                ) : null}
                <div className="mt-1 flex flex-col gap-0.5">
                  <Link
                    href={`/candidatos/${candidate.id}/editar`}
                    className="text-xs font-normal text-primary hover:underline"
                  >
                    Ver ficha
                  </Link>
                  <Link
                    href={`/candidatos/${candidate.id}/financiacion`}
                    className="text-xs font-normal text-primary hover:underline"
                  >
                    Financiación
                  </Link>
                </div>
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
                        <span className="ml-1 rounded-full bg-success-weak px-1.5 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap text-success uppercase">
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
                    className="font-medium text-primary hover:underline"
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

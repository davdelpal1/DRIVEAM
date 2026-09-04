import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

import { ScoreBadge } from "./score-badge";
import { barWidth, scoreBarClass, weightPercent } from "./score-format";
import type { ScoreBreakdown } from "./types";

/** Desglose explicativo del Car Score: la puntuación, el resumen y una fila por factor. */
export function ScoreBreakdownPanel({
  breakdown,
}: {
  breakdown: ScoreBreakdown;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card padded className="flex flex-col gap-3">
        <ScoreBadge score={breakdown.score} label={breakdown.label} />
        <p className="text-sm text-muted">{breakdown.summary}</p>
      </Card>

      {breakdown.factors.length > 0 ? (
        <dl className="flex flex-col gap-4">
          {breakdown.factors.map((factor) => (
            <div key={factor.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="font-medium">
                  {factor.label}
                  <span className="ml-2 text-xs font-normal text-subtle">
                    peso {weightPercent(factor.weight)}
                  </span>
                </dt>
                <dd className="tnum font-semibold">{factor.score}</dd>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full ${scoreBarClass(factor.score)}`}
                  style={{ width: barWidth(factor.score) }}
                />
              </div>
              <p className="text-xs text-subtle">{factor.detail}</p>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState title="No hay datos suficientes para puntuar este candidato">
          Añade precio, kilómetros, año o una oferta de financiación.
        </EmptyState>
      )}

      {breakdown.missing.length > 0 ? (
        <p className="text-xs text-subtle">
          Todavía no se puntúa: {breakdown.missing.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

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
      <ScoreBadge score={breakdown.score} label={breakdown.label} />

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {breakdown.summary}
      </p>

      {breakdown.factors.length > 0 ? (
        <dl className="flex flex-col gap-4">
          {breakdown.factors.map((factor) => (
            <div key={factor.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="font-medium">
                  {factor.label}
                  <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    peso {weightPercent(factor.weight)}
                  </span>
                </dt>
                <dd className="font-semibold tabular-nums">{factor.score}</dd>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className={`h-full rounded-full ${scoreBarClass(factor.score)}`}
                  style={{ width: barWidth(factor.score) }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {factor.detail}
              </p>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-xl border border-black/10 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No hay datos suficientes para puntuar este candidato. Añade precio,
          kilómetros, año o una oferta de financiación.
        </p>
      )}

      {breakdown.missing.length > 0 ? (
        <p className="text-xs text-zinc-400">
          Todavía no se puntúa: {breakdown.missing.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

import { scoreTextClass } from "./score-format";

/**
 * Bloque "87 / 100 · Muy buen candidato". `compact` para la tarjeta del dashboard; sin él,
 * versión grande para la página de detalle del score.
 */
export function ScoreBadge({
  score,
  label,
  compact = false,
}: {
  score: number | null;
  label: string;
  compact?: boolean;
}) {
  const tone = scoreTextClass(score);
  const value = score === null ? "—" : score;

  if (compact) {
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className={`font-semibold tabular-nums ${tone}`}>{value}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">/100</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-semibold tabular-nums ${tone}`}>
          {value}
        </span>
        <span className="text-lg text-zinc-500 dark:text-zinc-400">/ 100</span>
      </div>
      <p className={`text-sm font-medium ${tone}`}>{label}</p>
    </div>
  );
}

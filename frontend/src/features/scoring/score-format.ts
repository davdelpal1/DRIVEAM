/**
 * Presentación del Car Score (FASE 7). Funciones puras para poder testearlas: las bandas de
 * color y el ancho de las barras del desglose se derivan aquí, no en los componentes.
 */

export type ScoreTone = "great" | "good" | "ok" | "weak" | "none";

/** Banda del Car Score, alineada con las bandas del backend (`engine._BANDS`). */
export function scoreTone(score: number | null): ScoreTone {
  if (score === null) return "none";
  if (score >= 85) return "great";
  if (score >= 70) return "good";
  if (score >= 50) return "ok";
  return "weak";
}

const TEXT_CLASS: Record<ScoreTone, string> = {
  great: "text-emerald-700 dark:text-emerald-400",
  good: "text-lime-700 dark:text-lime-400",
  ok: "text-amber-700 dark:text-amber-400",
  weak: "text-red-700 dark:text-red-400",
  none: "text-zinc-500 dark:text-zinc-400",
};

const BAR_CLASS: Record<ScoreTone, string> = {
  great: "bg-emerald-600 dark:bg-emerald-500",
  good: "bg-lime-600 dark:bg-lime-500",
  ok: "bg-amber-500",
  weak: "bg-red-500",
  none: "bg-zinc-400",
};

export function scoreTextClass(score: number | null): string {
  return TEXT_CLASS[scoreTone(score)];
}

export function scoreBarClass(score: number | null): string {
  return BAR_CLASS[scoreTone(score)];
}

/** Ancho CSS de una barra de subpuntuación (0-100), recortado al rango. */
export function barWidth(sub: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(sub)));
  return `${clamped}%`;
}

/** Peso normalizado ("0.31") como porcentaje entero para la interfaz ("31 %"). */
export function weightPercent(weight: string): string {
  const value = Number(weight);
  if (!Number.isFinite(value)) return "";
  return `${Math.round(value * 100)} %`;
}

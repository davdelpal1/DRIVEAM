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
  great: "text-success",
  good: "text-accent-fg",
  ok: "text-warning",
  weak: "text-danger",
  none: "text-subtle",
};

const BAR_CLASS: Record<ScoreTone, string> = {
  great: "bg-success",
  good: "bg-accent",
  ok: "bg-warning",
  weak: "bg-danger",
  none: "bg-subtle",
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

/**
 * Car Score V1 (FASE 7).
 *
 * El cálculo es del backend (`backend/apps/scoring/engine.py`): reglas deterministas con
 * pesos configurables (las prioridades del usuario), puntuación 0-100 y un desglose que
 * **explica** el número. Aquí solo se pinta. El contrato completo es el esquema OpenAPI.
 */

/** Puntuación de un factor concreto dentro del Car Score. */
export interface FactorScore {
  key: string;
  label: string;
  /** Subpuntuación del factor, 0-100. */
  score: number;
  /** Peso normalizado del factor en el total, p. ej. "0.31". */
  weight: string;
  /** Texto que explica la subpuntuación (cifra concreta frente a la preferencia). */
  detail: string;
}

/** Desglose completo del Car Score de un candidato para el usuario. */
export interface ScoreBreakdown {
  /** Puntuación final 0-100, o `null` si no hay datos suficientes. */
  score: number | null;
  /** Versión del algoritmo (`v1`). */
  version: string;
  /** Banda cualitativa ("Muy buen candidato", …). */
  label: string;
  /** Frase que resume por qué sale ese número. */
  summary: string;
  factors: FactorScore[];
  /** Factores que la V1 todavía no puntúa (consumo, fiabilidad, y los que faltan por dato). */
  missing: string[];
}

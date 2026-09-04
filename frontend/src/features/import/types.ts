/**
 * Importación por URL (FASE 8).
 *
 * `POST /api/v1/listings/import/` lee la página del anuncio y devuelve un candidato **para
 * revisar** (no persiste nada). El usuario corrige lo que haga falta y guarda con el alta
 * normal de candidatos, enviando `import_url` para conservar la procedencia.
 */

import type { CandidateInput } from "@/features/candidates/types";

export interface ImportPreview {
  source: { slug: string; name: string };
  source_url: string;
  title: string;
  warnings: string[];
  raw: Record<string, unknown>;
  /** Datos ya normalizados, con la forma del formulario de alta de candidato. */
  candidate: CandidateInput & { import_url: string };
}

/** Error estructurado del endpoint de importación (`{code, detail}`). */
export interface ImportError {
  code: string;
  detail: string;
}

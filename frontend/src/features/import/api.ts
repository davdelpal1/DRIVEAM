import { apiMutate } from "@/lib/api";

import type { ImportPreview } from "./types";

/** Lee una URL de anuncio y devuelve los datos normalizados para revisión. */
export function importListing(url: string): Promise<ImportPreview> {
  return apiMutate<ImportPreview>("/listings/import/", "POST", { url });
}

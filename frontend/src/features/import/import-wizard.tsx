"use client";

import { useState, type FormEvent } from "react";

import { CandidateForm } from "@/features/candidates/candidate-form";
import { fromCandidateInput } from "@/features/candidates/form-payload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

import { importListing } from "./api";
import type { ImportError, ImportPreview } from "./types";

function errorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.data &&
    typeof error.data === "object" &&
    "detail" in error.data
  ) {
    return String((error.data as ImportError).detail);
  }
  return "No se pudo importar el enlace. Revísalo e inténtalo de nuevo.";
}

export function ImportWizard() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" | "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; preview: ImportPreview }
  >({ kind: "idle" });

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });
    try {
      const preview = await importListing(url.trim());
      setStatus({ kind: "ready", preview });
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  if (status.kind === "ready") {
    const { preview } = status;
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4 text-sm dark:border-white/15 dark:bg-white/[0.04]">
          <p className="font-medium">Datos leídos de la página</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Fuente: {preview.source.name}. Revisa y corrige lo que haga falta
            antes de guardar; solo se guardará cuando pulses el botón.
          </p>
          {preview.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-500">
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-3 text-xs underline underline-offset-4"
            onClick={() => setStatus({ kind: "idle" })}
          >
            ← Empezar de nuevo con otro enlace
          </button>
        </div>

        <CandidateForm
          initialValues={fromCandidateInput(preview.candidate)}
          importUrl={preview.candidate.import_url}
          submitLabel="Guardar candidato"
        />
      </div>
    );
  }

  const loading = status.kind === "loading";

  return (
    <form onSubmit={handleImport} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Enlace del anuncio
        <Input
          type="url"
          required
          value={url}
          disabled={loading}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
        />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading || url.trim() === ""}>
          {loading ? "Leyendo la página…" : "Detectar e importar"}
        </Button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Se leen solo los datos estructurados que la propia página publica
        (schema.org / Open Graph). No todas las webs los incluyen.
      </p>
    </form>
  );
}

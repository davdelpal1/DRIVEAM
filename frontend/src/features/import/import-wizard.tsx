"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CandidateForm } from "@/features/candidates/candidate-form";
import { fromCandidateInput } from "@/features/candidates/form-payload";
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
        <Card>
          <CardBody className="flex flex-col gap-2">
            <p className="font-medium">Datos leídos de la página</p>
            <p className="text-sm text-muted">
              Fuente: {preview.source.name}. Revisa y corrige lo que haga
              falta antes de guardar; solo se guardará cuando pulses el botón.
            </p>
            {preview.warnings.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-warning">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="mt-1 w-fit text-xs font-medium text-primary hover:underline"
              onClick={() => setStatus({ kind: "idle" })}
            >
              ← Empezar de nuevo con otro enlace
            </button>
          </CardBody>
        </Card>

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
    <Card>
      <CardBody>
        <form onSubmit={handleImport} className="flex flex-col gap-4">
          <Field
            label="Enlace del anuncio"
            hint="Se leen solo los datos estructurados que la propia página publica (schema.org / Open Graph). No todas las webs los incluyen."
          >
            <Input
              type="url"
              required
              value={url}
              disabled={loading}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading || url.trim() === ""}>
              {loading ? "Leyendo la página…" : "Detectar e importar"}
            </Button>
            {status.kind === "error" && <Alert tone="danger">{status.message}</Alert>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

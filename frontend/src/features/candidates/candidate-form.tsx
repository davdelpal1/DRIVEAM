"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

import { createCandidate, updateCandidate } from "./api";
import {
  EMPTY_CANDIDATE,
  fromCandidate,
  toPayload,
  type CandidateFormValues,
} from "./form-payload";
import { FUEL_TYPE_OPTIONS, type Candidate } from "./types";

type Status =
  | { kind: "idle" | "saving" }
  | { kind: "error"; message: string; fields: string[] };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-black/10 pt-5 dark:border-white/10">
      <legend className="text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function CandidateForm({
  initialCandidate,
}: {
  initialCandidate?: Candidate;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CandidateFormValues>(() =>
    initialCandidate ? fromCandidate(initialCandidate) : EMPTY_CANDIDATE,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function update(patch: Partial<CandidateFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setStatus({ kind: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const payload = toPayload(values);
      if (initialCandidate) {
        await updateCandidate(initialCandidate.id, payload);
      } else {
        await createCandidate(payload);
      }
      router.push("/candidatos");
      router.refresh();
    } catch (error) {
      const fields =
        error instanceof ApiError &&
        error.data &&
        typeof error.data === "object" &&
        !Array.isArray(error.data)
          ? Object.keys(error.data as Record<string, unknown>)
          : [];
      setStatus({
        kind: "error",
        message: fields.length
          ? `Revisa estos campos: ${fields.join(", ")}`
          : "No se pudo guardar el candidato. Inténtalo de nuevo.",
        fields,
      });
    }
  }

  const saving = status.kind === "saving";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Fieldset legend="Coche">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca">
            <Input
              required
              value={values.make}
              onChange={(event) => update({ make: event.target.value })}
            />
          </Field>
          <Field label="Modelo">
            <Input
              required
              value={values.model}
              onChange={(event) => update({ model: event.target.value })}
            />
          </Field>
          <Field label="Versión">
            <Input
              value={values.version}
              onChange={(event) => update({ version: event.target.value })}
              placeholder="1.5 TSI FR"
            />
          </Field>
          <Field label="Combustible">
            <select
              className="h-10 w-full rounded-lg border border-black/15 bg-transparent px-3 text-sm dark:border-white/20"
              value={values.fuel_type}
              onChange={(event) => update({ fuel_type: event.target.value })}
            >
              <option value="desconocido">Sin especificar</option>
              {FUEL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Potencia (CV)">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.power_cv}
              onChange={(event) => update({ power_cv: event.target.value })}
            />
          </Field>
          <Field label="Año">
            <Input
              type="number"
              min={1900}
              max={2100}
              inputMode="numeric"
              value={values.year}
              onChange={(event) => update({ year: event.target.value })}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Anuncio">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kilómetros">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.mileage_km}
              onChange={(event) => update({ mileage_km: event.target.value })}
            />
          </Field>
          <Field label="Precio al contado (€)">
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={values.price_cash}
              onChange={(event) => update({ price_cash: event.target.value })}
            />
          </Field>
          <Field label="Precio financiado (€)">
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={values.price_financed}
              onChange={(event) =>
                update({ price_financed: event.target.value })
              }
            />
          </Field>
          <Field label="Garantía (meses)">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.warranty_months}
              onChange={(event) =>
                update({ warranty_months: event.target.value })
              }
            />
          </Field>
          <Field label="Vendedor">
            <Input
              value={values.seller_name}
              onChange={(event) => update({ seller_name: event.target.value })}
            />
          </Field>
          <Field label="Ubicación">
            <Input
              value={values.location}
              onChange={(event) => update({ location: event.target.value })}
              placeholder="Sevilla"
            />
          </Field>
        </div>
        <Field label="URL del anuncio">
          <Input
            type="url"
            value={values.url}
            onChange={(event) => update({ url: event.target.value })}
            placeholder="https://…"
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Notas">
        <textarea
          className="min-h-24 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          value={values.notes}
          onChange={(event) => update({ notes: event.target.value })}
          placeholder="Observaciones, historial, dudas para la visita…"
        />
      </Fieldset>

      <div className="flex items-center gap-4 border-t border-black/10 pt-5 dark:border-white/10">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Guardando…"
            : initialCandidate
              ? "Guardar cambios"
              : "Añadir candidato"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/candidatos")}
        >
          Cancelar
        </Button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}

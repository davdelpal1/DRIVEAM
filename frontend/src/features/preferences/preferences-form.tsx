"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Fieldset } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

import { updatePreferences } from "./api";
import {
  fromPreference,
  toPayload,
  type PreferenceFormValues,
} from "./form-payload";
import { FUEL_TYPE_OPTIONS, WEIGHT_FIELDS, type Preference } from "./types";

type Status =
  | { kind: "idle" | "saving" | "saved" }
  | { kind: "error"; message: string };

export function PreferencesForm({
  initialPreference,
}: {
  initialPreference: Preference;
}) {
  const [values, setValues] = useState<PreferenceFormValues>(() =>
    fromPreference(initialPreference),
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function update(patch: Partial<PreferenceFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setStatus({ kind: "idle" });
  }

  function toggleFuel(value: string) {
    update({
      fuel_types: values.fuel_types.includes(value)
        ? values.fuel_types.filter((item) => item !== value)
        : [...values.fuel_types, value],
    });
  }

  function setWeight(key: string, value: string) {
    update({ weights: { ...values.weights, [key]: value } });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const saved = await updatePreferences(toPayload(values));
      setValues(fromPreference(saved));
      setStatus({ kind: "saved" });
    } catch (error) {
      const message =
        error instanceof ApiError &&
        error.data &&
        typeof error.data === "object" &&
        !Array.isArray(error.data)
          ? `Revisa estos campos: ${Object.keys(error.data).join(", ")}`
          : "No se pudieron guardar las preferencias. Inténtalo de nuevo.";
      setStatus({ kind: "error", message });
    }
  }

  const saving = status.kind === "saving";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <CardBody>
          <Fieldset legend="Presupuesto" hint="Importe al contado, en euros.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Presupuesto objetivo">
                <Input
                  type="number"
                  min={0}
                  step="100"
                  inputMode="decimal"
                  value={values.budget_target}
                  onChange={(event) =>
                    update({ budget_target: event.target.value })
                  }
                />
              </Field>
              <Field label="Presupuesto máximo">
                <Input
                  type="number"
                  min={0}
                  step="100"
                  inputMode="decimal"
                  value={values.budget_max}
                  onChange={(event) => update({ budget_max: event.target.value })}
                />
              </Field>
            </div>
          </Fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Fieldset legend="Filtros">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Año mínimo">
                <Input
                  type="number"
                  min={1900}
                  max={2100}
                  step="1"
                  value={values.min_year}
                  onChange={(event) => update({ min_year: event.target.value })}
                />
              </Field>
              <Field label="Kilometraje máximo">
                <Input
                  type="number"
                  min={0}
                  step="1000"
                  value={values.max_mileage}
                  onChange={(event) =>
                    update({ max_mileage: event.target.value })
                  }
                />
              </Field>
            </div>
          </Fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Fieldset legend="Combustibles aceptados">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {FUEL_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={values.fuel_types.includes(option.value)}
                    onChange={() => toggleFuel(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Fieldset
            legend="Carrocerías"
            hint="Separa varias con comas (p. ej. «familiar, SUV»)."
          >
            <Input
              value={values.body_types}
              onChange={(event) => update({ body_types: event.target.value })}
              placeholder="familiar, SUV, berlina"
            />
          </Fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Fieldset
            legend="Prioridades"
            hint="Peso de cada factor en el Car Score (0–100). El motor los normaliza."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {WEIGHT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label}>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={values.weights[field.key]}
                    onChange={(event) => setWeight(field.key, event.target.value)}
                  />
                </Field>
              ))}
            </div>
          </Fieldset>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-md backdrop-blur">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar preferencias"}
        </Button>
        {status.kind === "saved" && (
          <Alert tone="success">Preferencias guardadas.</Alert>
        )}
        {status.kind === "error" && <Alert tone="danger">{status.message}</Alert>}
      </div>
    </form>
  );
}

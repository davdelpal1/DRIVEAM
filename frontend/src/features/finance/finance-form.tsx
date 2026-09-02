"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Candidate } from "@/features/candidates/types";
import { ApiError } from "@/lib/api";

import {
  calculateFinance,
  deleteCandidateFinance,
  saveCandidateFinance,
} from "./api";
import { FinanceBreakdownPanel } from "./finance-breakdown";
import { EMPTY_FINANCE, eur, fromOffer, toOfferBody, toTerms } from "./format";
import type {
  FinanceBreakdown,
  FinanceFormValues,
  FinanceOffer,
} from "./types";

const EMPTY_BREAKDOWN: FinanceBreakdown = {
  amount_financed: null,
  total_payments: null,
  total_financed_cost: null,
  difference_vs_cash: null,
  annual_cost_approx: null,
};

const NUMBER_FIELDS: Array<{
  key: keyof FinanceFormValues;
  label: string;
  step?: string;
}> = [
  { key: "deposit", label: "Entrada (€)", step: "0.01" },
  { key: "amount_financed", label: "Importe financiado (€)", step: "0.01" },
  { key: "monthly_payment", label: "Cuota mensual (€)", step: "0.01" },
  { key: "number_of_payments", label: "Número de cuotas" },
  { key: "final_payment", label: "Cuota final (€)", step: "0.01" },
  { key: "opening_fee", label: "Comisión de apertura (€)", step: "0.01" },
  {
    key: "mandatory_products_cost",
    label: "Productos obligatorios (€)",
    step: "0.01",
  },
  { key: "tin", label: "TIN (%)", step: "0.001" },
  { key: "tae", label: "TAE (%)", step: "0.001" },
];

export function FinanceForm({
  candidate,
  initialOffer,
}: {
  candidate: Candidate;
  initialOffer: FinanceOffer | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FinanceFormValues>(() =>
    fromOffer(initialOffer, candidate.price_cash),
  );
  const [breakdown, setBreakdown] = useState<FinanceBreakdown>(
    initialOffer?.breakdown ?? EMPTY_BREAKDOWN,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOffer, setHasOffer] = useState(initialOffer !== null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const preview = useCallback((next: FinanceFormValues) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      calculateFinance(toTerms(next))
        .then(setBreakdown)
        .catch(() => setBreakdown(EMPTY_BREAKDOWN));
    }, 300);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function update(key: keyof FinanceFormValues, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    setError(null);
    preview(next);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveCandidateFinance(
        candidate.id,
        toOfferBody(values),
      );
      setBreakdown(saved.breakdown);
      setHasOffer(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "No se pudo guardar. Revisa los importes."
          : "No se pudo guardar. Inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await deleteCandidateFinance(candidate.id);
      setValues({ ...EMPTY_FINANCE, price_cash: values.price_cash });
      setBreakdown(EMPTY_BREAKDOWN);
      setHasOffer(false);
      router.refresh();
    } catch {
      setError("No se pudo eliminar la financiación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Precio al contado del anuncio:{" "}
          <strong>{eur(values.price_cash || null)}</strong>. Introduce las
          condiciones de la financiación tal y como se anuncian; los importes
          vacíos no cuentan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {NUMBER_FIELDS.map(({ key, label, step }) => (
            <label
              key={key}
              className="flex flex-col gap-1.5 text-sm font-medium"
            >
              {label}
              <Input
                type="number"
                min={0}
                step={step}
                inputMode={step ? "decimal" : "numeric"}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Texto original de la oferta (opcional)
          <textarea
            className="min-h-20 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            value={values.source_text}
            onChange={(event) => update("source_text", event.target.value)}
            placeholder="189 €/mes en 96 cuotas, TIN 6,95%, TAE 9,32%…"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4 border-t border-black/10 pt-4 dark:border-white/10">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar financiación"}
          </Button>
          {hasOffer && (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void handleDelete()}
            >
              Eliminar financiación
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/candidatos")}
          >
            Volver
          </Button>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </form>

      <aside className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Coste real</h2>
        <FinanceBreakdownPanel breakdown={breakdown} />
      </aside>
    </div>
  );
}

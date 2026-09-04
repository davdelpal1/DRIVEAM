import { Card } from "@/components/ui/card";

import { eur } from "./format";
import { BREAKDOWN_LABELS, type FinanceBreakdown } from "./types";

const ROW_ORDER: Array<keyof FinanceBreakdown> = [
  "amount_financed",
  "total_payments",
  "total_financed_cost",
  "annual_cost_approx",
  "difference_vs_cash",
];

/** Panel de resultados de la calculadora. `—` cuando falta algún dato de esa métrica. */
export function FinanceBreakdownPanel({
  breakdown,
}: {
  breakdown: FinanceBreakdown;
}) {
  return (
    <Card padded>
      <dl className="flex flex-col gap-2 text-sm">
        {ROW_ORDER.map((key) => {
          const value = breakdown[key];
          const { label, needs } = BREAKDOWN_LABELS[key];
          const emphasis =
            key === "difference_vs_cash" && value !== null
              ? Number(value) > 0
                ? "text-danger"
                : "text-success"
              : "";
          return (
            <div
              key={key}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <dt className="text-muted">
                {label}
                {value === null ? (
                  <span className="block text-xs text-subtle">
                    Falta: {needs}
                  </span>
                ) : null}
              </dt>
              <dd className={`tnum font-semibold ${emphasis}`}>
                {key === "difference_vs_cash" &&
                value !== null &&
                Number(value) > 0
                  ? `+${eur(value)}`
                  : eur(value)}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}

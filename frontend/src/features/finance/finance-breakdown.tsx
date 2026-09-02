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
    <dl className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 text-sm dark:border-white/15">
      {ROW_ORDER.map((key) => {
        const value = breakdown[key];
        const { label, needs } = BREAKDOWN_LABELS[key];
        const emphasis =
          key === "difference_vs_cash" && value !== null
            ? Number(value) > 0
              ? "text-red-700 dark:text-red-400"
              : "text-emerald-700 dark:text-emerald-400"
            : "";
        return (
          <div
            key={key}
            className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-2 last:border-0 last:pb-0 dark:border-white/10"
          >
            <dt className="text-zinc-600 dark:text-zinc-400">
              {label}
              {value === null ? (
                <span className="block text-xs text-zinc-400">
                  Falta: {needs}
                </span>
              ) : null}
            </dt>
            <dd className={`font-semibold tabular-nums ${emphasis}`}>
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
  );
}

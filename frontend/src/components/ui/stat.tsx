import { cn } from "@/lib/cn";

/** Cifra grande tabular + etiqueta. Para resúmenes del dashboard, score y financiación. */
export function Stat({
  label,
  value,
  tone = "neutral",
  size = "md",
  className,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const toneClass = {
    neutral: "text-fg",
    primary: "text-primary",
    success: "text-success",
    danger: "text-danger",
  }[tone];
  const sizeClass = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className={cn("tnum font-semibold", sizeClass, toneClass)}>
        {value}
      </span>
      <span className="text-xs font-medium text-subtle uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

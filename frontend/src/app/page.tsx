import Link from "next/link";

import { Container } from "@/components/container";
import { Card, CardBody } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/server-auth";

const FEATURES = [
  {
    title: "Guarda",
    description:
      "Reúne cada coche que valoras en un único sitio: alta manual o importado por URL, con su precio, kilómetros y anuncio original.",
  },
  {
    title: "Compara",
    description:
      "Pon hasta 5 candidatos lado a lado y ve al instante qué anuncio gana en precio, año, kilómetros, garantía o coste financiado.",
  },
  {
    title: "Evalúa",
    description:
      "El Car Score puntúa cada candidato del 0 al 100 según tus prioridades reales y explica el porqué, factor a factor.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <Container size="wide" className="gap-16">
      <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full bg-primary-weak px-3 py-1 text-xs font-semibold tracking-wide text-primary-weak-fg uppercase">
            Búsqueda de coche de ocasión
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Deja de comparar coches en una hoja de cálculo
          </h1>
          <p className="max-w-xl text-lg text-muted">
            DRIVEAM reúne tus candidatos de cualquier fuente, calcula el coste real
            de cada financiación y puntúa cada anuncio según lo que de verdad te
            importa a ti.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {user ? (
              <Link href="/candidatos" className={buttonClass({ size: "lg" })}>
                Ir a Mis coches
              </Link>
            ) : (
              <Link href="/registro" className={buttonClass({ size: "lg" })}>
                Crear cuenta gratis
              </Link>
            )}
            <Link
              href="/catalogo"
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              Ver el catálogo
            </Link>
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-wide text-subtle uppercase">
            Car Score
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-6xl font-semibold text-success">87</span>
            <span className="text-xl text-subtle">/ 100</span>
          </div>
          <p className="mt-1 text-sm font-medium text-success">
            Muy buen candidato
          </p>
          <ul className="mt-5 flex flex-col gap-3 text-sm">
            {[
              ["Precio", 92],
              ["Kilómetros", 85],
              ["Financiación", 78],
            ].map(([label, value]) => (
              <li key={label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="tnum font-semibold">{value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} padded>
            <CardBody className="p-0">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </Container>
  );
}

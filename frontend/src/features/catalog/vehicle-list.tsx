import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

import { getListings, getVehicles } from "./api";
import type { Listing, Vehicle } from "./types";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-ES");

function formatPrice(value: string | null): string {
  if (value === null) return "precio no disponible";
  return eur.format(Number(value));
}

function formatMileage(km: number | null): string {
  if (km === null) return "km no disponibles";
  return `${decimal.format(km)} km`;
}

interface Catalog {
  vehicles: Vehicle[];
  listingsByVehicle: Map<number, Listing[]>;
}

async function loadCatalog(): Promise<Catalog | { error: string }> {
  try {
    const [vehicles, listings] = await Promise.all([
      getVehicles(),
      getListings(),
    ]);
    const listingsByVehicle = new Map<number, Listing[]>();
    for (const listing of listings.results) {
      const group = listingsByVehicle.get(listing.vehicle) ?? [];
      group.push(listing);
      listingsByVehicle.set(listing.vehicle, group);
    }
    return { vehicles: vehicles.results, listingsByVehicle };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "error desconocido",
    };
  }
}

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-2.5 text-sm">
      <a
        href={listing.url}
        className="font-medium text-primary hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        {listing.source_detail.name}
      </a>
      <span className="flex items-center gap-2 text-muted">
        <span className="tnum">{formatPrice(listing.price_cash)}</span>
        <span>· {formatMileage(listing.mileage_km)}</span>
        {listing.province ? <span>· {listing.province}</span> : null}
        <Badge>{listing.status}</Badge>
      </span>
    </li>
  );
}

function VehicleCard({
  vehicle,
  listings,
}: {
  vehicle: Vehicle;
  listings: Listing[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle.display_name}</CardTitle>
        <span className="font-mono text-xs text-subtle">
          {vehicle.fuel_type}
          {vehicle.first_registration_year
            ? ` · ${vehicle.first_registration_year}`
            : ""}
        </span>
      </CardHeader>
      {listings.length > 0 ? (
        <ul className="divide-y divide-border">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-3 text-sm text-muted">
          Sin anuncios asociados todavía.
        </p>
      )}
    </Card>
  );
}

export async function VehicleList() {
  const catalog = await loadCatalog();

  if ("error" in catalog) {
    return <Alert tone="danger">No se pudo cargar el catálogo: {catalog.error}</Alert>;
  }

  if (catalog.vehicles.length === 0) {
    return (
      <EmptyState title="Todavía no hay vehículos">
        Créalo desde el{" "}
        <a
          className="font-medium text-primary hover:underline"
          href="/api/v1/schema/swagger-ui/"
        >
          panel de la API
        </a>{" "}
        o el admin de Django.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {catalog.vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          listings={catalog.listingsByVehicle.get(vehicle.id) ?? []}
        />
      ))}
    </div>
  );
}

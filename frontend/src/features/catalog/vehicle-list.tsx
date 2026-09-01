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
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
      <a
        href={listing.url}
        className="font-medium underline underline-offset-4"
        target="_blank"
        rel="noreferrer"
      >
        {listing.source_detail.name}
      </a>
      <span className="text-zinc-600 dark:text-zinc-400">
        {formatPrice(listing.price_cash)} · {formatMileage(listing.mileage_km)}
        {listing.province ? ` · ${listing.province}` : ""} · {listing.status}
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
    <article className="rounded-xl border border-black/10 dark:border-white/15">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h3 className="font-semibold">{vehicle.display_name}</h3>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {vehicle.fuel_type}
          {vehicle.first_registration_year
            ? ` · ${vehicle.first_registration_year}`
            : ""}
        </span>
      </header>
      {listings.length > 0 ? (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
          Sin anuncios asociados todavía.
        </p>
      )}
    </article>
  );
}

export async function VehicleList() {
  const catalog = await loadCatalog();

  if ("error" in catalog) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        No se pudo cargar el catálogo: {catalog.error}
      </p>
    );
  }

  if (catalog.vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Todavía no hay vehículos. Crea uno desde el{" "}
        <a
          className="underline underline-offset-4"
          href="/api/v1/schema/swagger-ui/"
        >
          panel de la API
        </a>{" "}
        o el admin de Django.
      </p>
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

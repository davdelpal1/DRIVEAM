import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Paginated } from "@/lib/api";

import { getListings, getVehicles } from "./api";
import type { Listing, Vehicle } from "./types";
import { VehicleList } from "./vehicle-list";

vi.mock("./api", () => ({
  getVehicles: vi.fn(),
  getListings: vi.fn(),
}));

const mockGetVehicles = vi.mocked(getVehicles);
const mockGetListings = vi.mocked(getListings);

function page<T>(results: T[]): Paginated<T> {
  return { count: results.length, next: null, previous: null, results };
}

const seatLeon: Vehicle = {
  id: 1,
  make: "Seat",
  model: "León",
  version: "1.6 TDI",
  display_name: "Seat León 1.6 TDI",
  fuel_type: "diesel",
  transmission: "manual",
  first_registration_year: 2020,
};

const anuncio: Listing = {
  id: 10,
  url: "https://ejemplo.test/1",
  title: "",
  status: "activo",
  price_cash: "10500.00",
  price_financed: null,
  mileage_km: 87000,
  province: "Sevilla",
  vehicle: 1,
  vehicle_detail: seatLeon,
  source_detail: { id: 1, name: "Portal X", slug: "portal-x" },
};

describe("VehicleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra un estado vacío cuando no hay vehículos", async () => {
    mockGetVehicles.mockResolvedValue(page<Vehicle>([]));
    mockGetListings.mockResolvedValue(page<Listing>([]));

    render(await VehicleList());

    expect(screen.getByText(/Todavía no hay vehículos/)).toBeInTheDocument();
  });

  it("lista cada vehículo con su anuncio y precio formateado", async () => {
    mockGetVehicles.mockResolvedValue(page([seatLeon]));
    mockGetListings.mockResolvedValue(page([anuncio]));

    render(await VehicleList());

    expect(
      screen.getByRole("heading", { name: "Seat León 1.6 TDI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portal X" })).toHaveAttribute(
      "href",
      "https://ejemplo.test/1",
    );
    expect(screen.getByText(/10\.500/)).toBeInTheDocument();
  });

  it("muestra un mensaje de error si la API falla", async () => {
    mockGetVehicles.mockRejectedValue(new Error("La API respondió 500"));
    mockGetListings.mockResolvedValue(page<Listing>([]));

    render(await VehicleList());

    expect(
      screen.getByText(/No se pudo cargar el catálogo/),
    ).toBeInTheDocument();
  });
});

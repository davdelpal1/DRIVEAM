import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as candidatesApi from "./api";
import { CandidateDashboard } from "./candidate-dashboard";
import type { Candidate } from "./types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("./api", () => ({
  archiveCandidate: vi.fn(),
  deleteCandidate: vi.fn(),
  favoriteCandidate: vi.fn(),
  setCandidateStatus: vi.fn().mockResolvedValue({}),
  unarchiveCandidate: vi.fn(),
  unfavoriteCandidate: vi.fn(),
}));

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 1,
    vehicle_id: 1,
    make: "Seat",
    model: "León",
    version: "",
    fuel_type: "gasolina",
    power_cv: 150,
    year: 2020,
    mileage_km: 50000,
    price_cash: "18000.00",
    price_financed: null,
    seller_name: "",
    warranty_months: null,
    location: "",
    url: "",
    notes: "",
    tracking_status: "nuevo",
    source: "manual",
    source_label: "Entrada manual",
    score: null,
    is_favorite: false,
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("CandidateDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filtra la lista al elegir un estado", () => {
    render(
      <CandidateDashboard
        candidates={[
          candidate({ id: 1, make: "Seat" }),
          candidate({ id: 2, make: "Kia", tracking_status: "visita" }),
        ]}
      />,
    );

    expect(screen.getByText(/Seat León/)).toBeInTheDocument();
    expect(screen.getByText(/Kia León/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "visita" },
    });

    expect(screen.queryByText(/Seat León/)).not.toBeInTheDocument();
    expect(screen.getByText(/Kia León/)).toBeInTheDocument();
  });

  it("habilita el enlace de comparar al marcar dos candidatos", () => {
    render(
      <CandidateDashboard
        candidates={[
          candidate({ id: 1, make: "Seat" }),
          candidate({ id: 2, make: "Kia" }),
        ]}
      />,
    );

    const [first, second] = screen.getAllByLabelText("Comparar");
    fireEvent.click(first!);
    expect(screen.getByText(/Elige 2\+ para comparar/)).toBeInTheDocument();

    fireEvent.click(second!);
    const link = screen.getByRole("link", { name: /Comparar \(2\)/ });
    expect(link).toHaveAttribute("href", "/candidatos/comparar?ids=1,2");
  });

  it("cambia el estado de seguimiento de una tarjeta", async () => {
    render(<CandidateDashboard candidates={[candidate({ id: 7 })]} />);

    const cardStatus = screen.getAllByRole("combobox").find((el) => {
      return (el as HTMLSelectElement).value === "nuevo";
    })!;
    fireEvent.change(cardStatus, { target: { value: "contactado" } });

    await waitFor(() =>
      expect(candidatesApi.setCandidateStatus).toHaveBeenCalledWith(
        7,
        "contactado",
      ),
    );
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";

import * as candidatesApi from "./api";
import { CandidateForm } from "./candidate-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("./api", () => ({
  createCandidate: vi.fn(),
  updateCandidate: vi.fn(),
}));

const mockedCreate = vi.mocked(candidatesApi.createCandidate);

describe("CandidateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía marca, modelo y precio y vuelve al listado", async () => {
    mockedCreate.mockResolvedValue({} as never);

    render(<CandidateForm />);
    fireEvent.change(screen.getByLabelText("Marca"), {
      target: { value: "Seat" },
    });
    fireEvent.change(screen.getByLabelText("Modelo"), {
      target: { value: "León" },
    });
    fireEvent.change(screen.getByLabelText("Precio al contado (€)"), {
      target: { value: "18500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Añadir candidato" }));

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          make: "Seat",
          model: "León",
          price_cash: "18500",
          power_cv: null,
        }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/candidatos"));
  });

  it("muestra los campos que la API rechaza", async () => {
    mockedCreate.mockRejectedValue(
      new ApiError("400", 400, { make: ["Este campo es obligatorio."] }),
    );

    render(<CandidateForm />);
    fireEvent.change(screen.getByLabelText("Modelo"), {
      target: { value: "León" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Añadir candidato" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("make");
    expect(push).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as preferencesApi from "./api";
import { PreferencesForm } from "./preferences-form";
import type { Preference } from "./types";

vi.mock("./api", () => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}));

const mockedUpdate = vi.mocked(preferencesApi.updatePreferences);

const INITIAL: Preference = {
  budget_target: null,
  budget_max: null,
  max_mileage: null,
  min_year: null,
  fuel_types: [],
  body_types: [],
  weight_price: 25,
  weight_mileage: 20,
  weight_age: 15,
  weight_reliability: 15,
  weight_consumption: 10,
  weight_financing: 10,
  weight_warranty: 5,
};

describe("PreferencesForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUpdate.mockResolvedValue(INITIAL);
  });

  it("guarda presupuesto, combustible y peso, y confirma", async () => {
    render(<PreferencesForm initialPreference={INITIAL} />);

    fireEvent.change(screen.getByLabelText("Presupuesto máximo"), {
      target: { value: "15000" },
    });
    fireEvent.click(screen.getByLabelText("Diésel"));
    fireEvent.change(screen.getByLabelText("Precio"), {
      target: { value: "40" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar preferencias" }),
    );

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1));
    const payload = mockedUpdate.mock.calls[0]![0];
    expect(payload).toMatchObject({
      budget_max: "15000",
      fuel_types: ["diesel"],
      weight_price: 40,
    });
    expect(
      await screen.findByText("Preferencias guardadas."),
    ).toBeInTheDocument();
  });
});

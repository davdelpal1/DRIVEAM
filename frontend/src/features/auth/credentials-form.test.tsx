import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";

import * as authApi from "./api";
import { AuthProvider } from "./auth-provider";
import { CredentialsForm } from "./credentials-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("./api", () => ({
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
  fetchCurrentUser: vi.fn().mockResolvedValue(null),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const mockedLogin = vi.mocked(authApi.loginRequest);

function renderLogin() {
  return render(
    <AuthProvider initialUser={null}>
      <CredentialsForm mode="login" />
    </AuthProvider>,
  );
}

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: password },
  });
}

describe("CredentialsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía las credenciales y redirige al perfil", async () => {
    mockedLogin.mockResolvedValue({
      id: 1,
      email: "ana@example.test",
      date_joined: "2026-09-01T00:00:00Z",
    });

    renderLogin();
    fillCredentials("ana@example.test", "un-coche-de-ocasion-2026");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(mockedLogin).toHaveBeenCalledWith({
        email: "ana@example.test",
        password: "un-coche-de-ocasion-2026",
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/perfil"));
  });

  it("muestra el error de campo que devuelve la API", async () => {
    mockedLogin.mockRejectedValue(
      new ApiError("400", 400, { detail: ["Email o contraseña incorrectos."] }),
    );

    renderLogin();
    fillCredentials("ana@example.test", "mal");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Email o contraseña incorrectos."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

import { expect, test } from "@playwright/test";

const PASSWORD = "un-coche-de-ocasion-2026";

test("registro, guardar preferencias y cierre de sesión", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;

  // --- Registro: queda autenticado y aterriza en /perfil ---
  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/perfil$/);
  await expect(
    page.getByRole("heading", { name: "Preferencias de compra" }),
  ).toBeVisible();

  // --- Guardar preferencias ---
  await page.getByLabel("Año mínimo").fill("2019");
  await page.getByLabel("Diésel", { exact: true }).check();
  await page.getByLabel("Precio", { exact: true }).fill("40");
  await page.getByRole("button", { name: "Guardar preferencias" }).click();
  await expect(page.getByText("Preferencias guardadas.")).toBeVisible();

  // --- Persisten tras recargar ---
  await page.reload();
  await expect(page.getByLabel("Año mínimo")).toHaveValue("2019");
  await expect(page.getByLabel("Diésel", { exact: true })).toBeChecked();

  // --- Cierre de sesión: /perfil vuelve a pedir login ---
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/entrar$/);
});

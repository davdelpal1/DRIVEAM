import { expect, test } from "@playwright/test";

const PASSWORD = "un-coche-de-ocasion-2026";

test("el Car Score cambia con las prioridades del usuario (FASE 7)", async ({
  page,
}) => {
  const email = `e2e-score-${Date.now()}@example.test`;

  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  await expect(
    page.getByRole("heading", { name: "Preferencias de compra" }),
  ).toBeVisible();

  // --- Preferencias: presupuesto y todo el peso en el precio ---
  await page.getByLabel("Presupuesto objetivo").fill("13000");
  await page.getByLabel("Presupuesto máximo").fill("16000");
  await page.getByLabel("Precio", { exact: true }).fill("100");
  await page.getByLabel("Kilómetros", { exact: true }).fill("0");
  await page.getByLabel("Antigüedad", { exact: true }).fill("0");
  await page.getByLabel("Fiabilidad", { exact: true }).fill("0");
  await page.getByLabel("Consumo", { exact: true }).fill("0");
  await page.getByLabel("Financiación", { exact: true }).fill("0");
  await page.getByLabel("Garantía", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Guardar preferencias" }).click();
  await expect(page.getByText("Preferencias guardadas.")).toBeVisible();

  // --- Un candidato barato y algo antiguo ---
  await page.goto("/candidatos/nuevo");
  await page.getByLabel("Marca").fill("Seat");
  await page.getByLabel("Modelo").fill("León");
  await page.getByLabel("Año").fill("2015");
  await page.getByLabel("Precio al contado (€)").fill("12000");
  await page.getByRole("button", { name: "Añadir candidato" }).click();
  await expect(page).toHaveURL(/\/candidatos$/);

  // --- Con el peso en el precio: candidato muy bueno ---
  await page
    .locator("article", { hasText: "Seat León" })
    .getByRole("link", { name: "Score", exact: true })
    .click();
  await expect(page).toHaveURL(/\/candidatos\/\d+\/score$/);
  await expect(
    page.getByText("Muy buen candidato", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/A favor:.*precio/)).toBeVisible();

  // --- Cambiar el peso a la antigüedad: el coche viejo deja de destacar ---
  await page.goto("/perfil");
  await page.getByLabel("Precio", { exact: true }).fill("0");
  await page.getByLabel("Antigüedad", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Guardar preferencias" }).click();
  await expect(page.getByText("Preferencias guardadas.")).toBeVisible();

  await page.goto("/candidatos");
  await page
    .locator("article", { hasText: "Seat León" })
    .getByRole("link", { name: "Score", exact: true })
    .click();
  await expect(
    page.getByText("Candidato con reservas", { exact: true }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

const PASSWORD = "un-coche-de-ocasion-2026";

async function addCandidate(
  page: import("@playwright/test").Page,
  make: string,
  model: string,
  price: string,
) {
  await page.goto("/candidatos/nuevo");
  await page.getByLabel("Marca").fill(make);
  await page.getByLabel("Modelo").fill(model);
  await page.getByLabel("Precio al contado (€)").fill(price);
  await page.getByRole("button", { name: "Añadir candidato" }).click();
  await expect(page).toHaveURL(/\/candidatos$/);
}

test("calcular, guardar financiación y verla en el comparador (FASE 6)", async ({
  page,
}) => {
  const email = `e2e-fin-${Date.now()}@example.test`;

  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil$/);

  await addCandidate(page, "Seat", "León", "15000");
  await addCandidate(page, "Kia", "Ceed", "15000");

  // --- Calculadora: previsualización en vivo ---
  await page
    .locator("article", { hasText: "Seat León" })
    .getByRole("link", { name: "Financiación" })
    .click();
  await expect(page).toHaveURL(/\/candidatos\/\d+\/financiacion$/);

  await page.getByLabel("Entrada (€)").fill("3000");
  await page.getByLabel("Cuota mensual (€)").fill("200");
  await page.getByLabel("Número de cuotas").fill("60");
  await page.getByLabel("Comisión de apertura (€)").fill("300");

  const panel = page.locator("aside", { hasText: "Coste real" });
  // 3000 + 200*60 + 300 = 15.300 ; diferencia frente al contado (15.000) = +300
  await expect(panel).toContainText("15.300,00 €");
  await expect(panel).toContainText("+300,00 €");

  await page.getByRole("button", { name: "Guardar financiación" }).click();

  // --- Persistencia ---
  await page.reload();
  await expect(page.getByLabel("Entrada (€)")).toHaveValue("3000.00");
  await expect(page.locator("aside", { hasText: "Coste real" })).toContainText(
    "15.300,00 €",
  );

  // --- Oferta más cara para el segundo candidato ---
  await page.goto("/candidatos");
  await page
    .locator("article", { hasText: "Kia Ceed" })
    .getByRole("link", { name: "Financiación" })
    .click();
  await page.getByLabel("Cuota mensual (€)").fill("350");
  await page.getByLabel("Número de cuotas").fill("60");
  await page.getByRole("button", { name: "Guardar financiación" }).click();

  // --- Fila nueva en el comparador: gana el menor coste total ---
  await page.goto("/candidatos");
  await page
    .locator("article", { hasText: "Seat León" })
    .getByLabel("Comparar")
    .check();
  await page
    .locator("article", { hasText: "Kia Ceed" })
    .getByLabel("Comparar")
    .check();
  await page.getByRole("link", { name: /Comparar \(2\)/ }).click();
  await expect(page).toHaveURL(/\/candidatos\/comparar\?ids=/);

  const financeRow = page.getByRole("row", { name: /Coste total financiado/ });
  await expect(financeRow.getByText("Menor coste total")).toBeVisible();
  await expect(financeRow).toContainText("15.300 €");
  await expect(financeRow).toContainText("21.000 €");
});

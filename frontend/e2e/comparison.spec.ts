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

test("comparar dos candidatos y ver el indicador de menor precio", async ({
  page,
}) => {
  const email = `e2e-cmp-${Date.now()}@example.test`;

  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil$/);

  await addCandidate(page, "Seat", "León", "18500");
  await addCandidate(page, "Kia", "Ceed", "15000");

  // Seleccionar ambos para comparar.
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

  const priceRow = page.getByRole("row", { name: /Precio al contado/ });
  await expect(priceRow.getByText("Menor precio")).toBeVisible();
  await expect(priceRow).toContainText("15.000 €");
});

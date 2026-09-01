import { expect, test } from "@playwright/test";

const PASSWORD = "un-coche-de-ocasion-2026";

test("alta, favorito, archivado, edición y borrado de un candidato", async ({
  page,
}) => {
  const email = `e2e-cand-${Date.now()}@example.test`;

  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil$/);

  // --- Alta ---
  await page.goto("/candidatos/nuevo");
  await page.getByLabel("Marca").fill("Seat");
  await page.getByLabel("Modelo").fill("León");
  await page.getByLabel("Precio al contado (€)").fill("18500");
  await page.getByRole("button", { name: "Añadir candidato" }).click();

  await expect(page).toHaveURL(/\/candidatos$/);
  const card = page.locator("article", { hasText: "Seat León" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("18.500 €");

  // --- Favorito y archivado ---
  await card.getByRole("button", { name: "Favorito" }).click();
  await expect(card).toContainText("favorito");
  await card.getByRole("button", { name: "Archivar" }).click();
  await expect(page.getByText(/Mostrar archivados/)).toBeVisible();

  // --- Edición ---
  await page.getByText(/Mostrar archivados/).click();
  await card.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/candidatos\/\d+\/editar$/);
  await page.getByLabel("Marca").fill("Cupra");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.locator("article", { hasText: "Cupra León" }),
  ).toBeVisible();

  // --- Borrado ---
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("article", { hasText: "Cupra León" })
    .getByRole("button", { name: "Eliminar" })
    .click();
  await expect(
    page.getByText(/Todavía no has añadido ningún candidato/),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

const PASSWORD = "un-coche-de-ocasion-2026";

test("alta, favorito, edición, archivado y borrado de un candidato", async ({
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
  let card = page.locator("article", { hasText: "Seat León" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("18.500 €");

  // --- Favorito ---
  await card.getByRole("button", { name: "Favorito" }).click();
  await expect(card).toContainText("favorito");

  // --- Edición ---
  await card.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/candidatos\/\d+\/editar$/);
  await page.getByLabel("Marca").fill("Cupra");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/\/candidatos$/);
  card = page.locator("article", { hasText: "Cupra León" });
  await expect(card).toBeVisible();

  // --- Archivado: la tarjeta se oculta hasta marcar "Mostrar archivados" ---
  await card.getByRole("button", { name: "Archivar" }).click();
  await expect(card).toBeHidden();
  await page.getByRole("checkbox", { name: /Mostrar archivados/ }).check();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Desarchivar" }).click();

  // --- Borrado ---
  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Eliminar" }).click();
  await expect(
    page.getByText(/Todavía no has añadido ningún candidato/),
  ).toBeVisible();
});

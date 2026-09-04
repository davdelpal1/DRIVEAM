import { expect, test } from "@playwright/test";

const PASSWORD = "importo-un-coche-2026";

/**
 * Importación por URL (FASE 8). La descarga real de páginas externas se sustituye por un
 * `page.route` sobre el endpoint de importación (determinista, sin red); el guardado posterior
 * sí golpea el backend real, que fija la fuente `datos-estructurados`.
 */
test("pegar enlace, revisar y guardar el candidato importado", async ({
  page,
}) => {
  const email = `e2e-import-${Date.now()}@example.test`;

  await page.route("**/api/v1/listings/import/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: {
          slug: "datos-estructurados",
          name: "Datos estructurados (schema.org)",
        },
        source_url: "https://anuncio.example/golf",
        title: "Volkswagen Golf 1.5 TSI Life",
        warnings: [
          "El modelo se ha deducido del título del anuncio; revísalo.",
        ],
        raw: {},
        candidate: {
          make: "Volkswagen",
          model: "Golf",
          version: "1.5 TSI Life",
          fuel_type: "gasolina",
          power_cv: 131,
          year: 2021,
          fuel_consumption: "5.4",
          mileage_km: 48200,
          price_cash: "18990.00",
          seller_name: "Concesionario Ejemplo",
          location: "Sevilla",
          url: "https://anuncio.example/golf",
          import_url: "https://anuncio.example/golf",
        },
      }),
    });
  });

  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/perfil$/);

  await page.goto("/candidatos/importar");
  await page
    .getByLabel("Enlace del anuncio")
    .fill("https://anuncio.example/golf");
  await page.getByRole("button", { name: "Detectar e importar" }).click();

  // Revisión: datos precargados + aviso.
  await expect(page.getByText("Datos leídos de la página")).toBeVisible();
  await expect(page.getByText(/modelo se ha deducido/)).toBeVisible();
  await expect(page.getByLabel("Marca")).toHaveValue("Volkswagen");
  await expect(page.getByLabel("Consumo medio (L/100 km)")).toHaveValue("5.4");

  await page.getByRole("button", { name: "Guardar candidato" }).click();
  await expect(page).toHaveURL(/\/candidatos$/);

  const card = page.locator("article", { hasText: "Volkswagen Golf" });
  await expect(card).toContainText("Datos estructurados");

  // El consumo importado llega al Car Score (ya no es un factor pendiente).
  await card.getByRole("link", { name: "Score" }).first().click();
  await expect(page).toHaveURL(/\/candidatos\/\d+\/score$/);
  await expect(page.getByText(/Consumo/).first()).toBeVisible();
});

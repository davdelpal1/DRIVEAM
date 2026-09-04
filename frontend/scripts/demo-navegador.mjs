/**
 * Recorrido visible del MVP de DRIVEAM en un navegador real (Chrome o Edge).
 *
 * No es un test: abre una ventana, se mueve despacio y va narrando cada paso con un rótulo
 * superpuesto, como si lo estuvieras usando tú.
 *
 * Antes (una vez), sembrar los datos de demostración:
 *   docker compose exec backend python manage.py seed_demo
 *
 * Luego:
 *   cd frontend
 *   npm run demo             # Chrome
 *   BROWSER=msedge npm run demo
 *   SPEED=350 npm run demo   # ms de slowMo entre acciones (por defecto 700; menor = más rápido)
 *
 * Requiere el stack levantado (docker compose up).
 */

import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CHANNEL = process.env.BROWSER ?? "chrome"; // "chrome" | "msedge"
const SLOWMO = Number(process.env.SPEED ?? 700);
const EMAIL = process.env.DEMO_EMAIL ?? "demo@driveam.test";
const PASSWORD = process.env.DEMO_PASSWORD ?? "driveam-demo-2026";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({
    headless: false,
    channel: CHANNEL,
    slowMo: SLOWMO,
    args: ["--start-maximized"],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  page.on("dialog", (d) => d.accept()); // acepta el "¿Eliminar?" sin pararse

  // Rótulo narrador (se reinyecta tras cada navegación).
  async function say(text, ms = 1600) {
    await page.evaluate((t) => {
      let el = document.getElementById("__demo_caption__");
      if (!el) {
        el = document.createElement("div");
        el.id = "__demo_caption__";
        el.style.cssText = [
          "position:fixed",
          "left:50%",
          "top:16px",
          "transform:translateX(-50%)",
          "z-index:2147483647",
          "max-width:min(90vw,720px)",
          "padding:12px 20px",
          "border-radius:999px",
          "font:600 15px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
          "color:#fff",
          "background:rgba(17,17,17,.92)",
          "box-shadow:0 8px 30px rgba(0,0,0,.35)",
          "text-align:center",
          "pointer-events:none",
        ].join(";");
        document.body.appendChild(el);
      }
      el.textContent = t;
    }, text);
    await sleep(ms);
  }

  async function goto(path, caption) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await sleep(600);
    if (caption) await say(caption);
  }

  const card = (name) => page.locator("article", { hasText: name });

  // --- Stub de la importación por URL: respuesta simulada y determinista -----------
  await page.route("**/api/v1/listings/import/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: {
          slug: "datos-estructurados",
          name: "Datos estructurados (schema.org)",
        },
        source_url: "https://www.example-motor.es/cupra-formentor-1-5-tsi-2022",
        title: "Cupra Formentor 1.5 TSI 150 CV",
        warnings: [
          "El modelo se ha deducido del título del anuncio; revísalo.",
        ],
        raw: {},
        candidate: {
          make: "Cupra",
          model: "Formentor",
          version: "1.5 TSI 150 CV",
          fuel_type: "gasolina",
          power_cv: 150,
          year: 2022,
          fuel_consumption: "5.9",
          mileage_km: 39500,
          price_cash: "24990.00",
          seller_name: "Automoción Guadalquivir",
          location: "Sevilla",
          url: "https://www.example-motor.es/cupra-formentor-1-5-tsi-2022",
          import_url:
            "https://www.example-motor.es/cupra-formentor-1-5-tsi-2022",
        },
      }),
    }),
  );

  // === 1. Iniciar sesión =========================================================
  await goto("/entrar");
  await say("1/7 · Inicio de sesión con la cuenta de demostración");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/perfil$/);

  // === 2. Preferencias de compra ================================================
  await say(
    "2/7 · Perfil: tus criterios de búsqueda y las prioridades del Car Score",
  );
  await page
    .getByRole("heading", { name: "Preferencias de compra" })
    .scrollIntoViewIfNeeded();
  await say(
    "Subo el peso del PRECIO: el ranking se recalculará con esa prioridad",
  );
  await page.getByLabel("Precio", { exact: true }).fill("45");
  await page.getByRole("button", { name: "Guardar preferencias" }).click();
  await sleep(1200);

  // === 3. Limpieza de una demo anterior (si la hubo) ============================
  await goto(
    "/candidatos",
    "3/7 · Mis coches: el panel para gestionar toda la búsqueda",
  );
  while ((await card("Cupra Formentor").count()) > 0) {
    await say("Elimino el Cupra de una ejecución anterior para empezar limpio");
    await card("Cupra Formentor")
      .first()
      .getByRole("button", { name: "Eliminar" })
      .click();
    await sleep(1500);
  }

  // === 3b. Gestión rápida en el dashboard ======================================
  await say("Cambio el estado de seguimiento del Kia a «Visita»");
  await card("Kia Ceed")
    .getByRole("combobox")
    .selectOption({ label: "Visita" });
  await sleep(1000);
  await say("Filtro por precio máximo 16.000 €");
  await page.getByLabel("Precio máximo (€)").fill("16000");
  await sleep(1600);
  await page.getByLabel("Precio máximo (€)").fill("");
  await sleep(600);

  // === 4. Car Score explicado ==================================================
  await say("4/7 · El Car Score explica el número, factor a factor");
  await card("Volkswagen Golf")
    .getByRole("link", { name: "Score", exact: true })
    .click();
  await page.waitForURL(/\/candidatos\/\d+\/score$/);
  await say("El Golf baja porque se sale de tu presupuesto máximo…", 2200);
  await page.mouse.wheel(0, 400);
  await say(
    "…y cada factor (precio, km, antigüedad, consumo, garantía) trae su motivo",
    2600,
  );
  await page.mouse.wheel(0, 400);
  await sleep(1500);

  // === 5. Comparador =========================================================
  await goto("/candidatos", "5/7 · Selecciono 3 coches para compararlos");
  for (const name of ["Volkswagen Golf", "SEAT León", "Toyota Corolla"]) {
    await card(name).getByLabel("Comparar").check();
  }
  await page.getByRole("link", { name: /Comparar \(3\)/ }).click();
  await page.waitForURL(/\/candidatos\/comparar/);
  await say(
    "Tabla comparativa: se resalta el mejor valor de cada criterio",
    2400,
  );
  await page.mouse.wheel(0, 500);
  await say(
    "Consumo medio, coste total financiado, Car Score… lado a lado",
    2600,
  );
  await page.mouse.wheel(0, 500);
  await sleep(1500);

  // === 6. Calculadora de financiación ========================================
  await goto("/candidatos", "6/7 · Coste real de financiar un coche");
  await card("SEAT León").getByRole("link", { name: "Financiación" }).click();
  await page.waitForURL(/\/candidatos\/\d+\/financiacion$/);
  await say(
    "Cambio la cuota y el nº de cuotas: el coste total se recalcula en vivo",
  );
  await page.getByLabel("Cuota mensual (€)").fill("330");
  await page.getByLabel("Número de cuotas").fill("54");
  await sleep(2400);

  // === 7. Importación por URL (FASE 8) =======================================
  await goto(
    "/candidatos/importar",
    "7/7 · Importar un candidato pegando el enlace del anuncio",
  );
  await page
    .getByLabel("Enlace del anuncio")
    .fill("https://www.example-motor.es/cupra-formentor-1-5-tsi-2022");
  await say("Pego la URL y pulso «Detectar e importar»");
  await page.getByRole("button", { name: "Detectar e importar" }).click();
  await page.getByText("Datos leídos de la página").waitFor();
  await say(
    "DRIVEAM ha leído los datos estructurados de la página. Los reviso…",
    2600,
  );
  await page.mouse.wheel(0, 300);
  await say(
    "…y guardo. Queda con la fuente «Datos estructurados» y su URL de origen.",
  );
  await page.getByRole("button", { name: "Guardar candidato" }).click();
  await page.waitForURL(/\/candidatos$/);
  await card("Cupra Formentor").scrollIntoViewIfNeeded();
  await say("Candidato importado y en el panel. Fin del recorrido ✅", 4000);

  await sleep(2500);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

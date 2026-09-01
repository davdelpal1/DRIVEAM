import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de DRIVEAM. El navegador se ejecuta en el host (o en el runner de CI) y ataca al stack
 * de Docker Compose por `localhost`, igual que un navegador real. `webServer` levanta el stack
 * si no está ya en marcha (`reuseExistingServer`).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "docker compose up --build",
    cwd: "..",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

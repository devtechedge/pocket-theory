import { defineConfig, devices } from "@playwright/test";

const e2eDbUrl =
  process.env.DATABASE_URL_E2E?.trim() ||
  process.env.DATABASE_URL_TEST?.trim() ||
  "";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3140",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI ? { channel: "chrome" } : {}),
      },
    },
  ],
  webServer: {
    command: "npx next start -p 3140",
    url: "http://localhost:3140/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
      DATABASE_URL: e2eDbUrl,
      DATABASE_URL_UNPOOLED: e2eDbUrl,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3140",
      SESSION_PEPPER:
        process.env.SESSION_PEPPER ??
        "e2e-playwright-session-pepper-pocket-theory-2026",
      DEMO_MODE: "1",
      ALLOW_PROD_SEED: "1",
    },
  },
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "DATABASE_URL=postgres://meal_hq:meal_hq@localhost:5433/meal_hq_e2e PORT=3001 NEXT_DIST_DIR=.next-e2e pnpm dev",
    url: "http://localhost:3001",
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});

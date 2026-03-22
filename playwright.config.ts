import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: 1,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://gametan.ai",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Don't start a dev server — test against live site
});

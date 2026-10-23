import { defineConfig, devices } from "@playwright/test";

const PORT = 5273;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 }
  },
  // The E2E run gets its own server and Vite ports so browser tabs left open on
  // the normal dev server cannot create incidents behind the test's back.
  webServer: [
    {
      command: "npm run dev:server:e2e",
      url: "http://localhost:4100/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
      env: { PORT: "4100" },
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      command: "npm run dev:client:e2e",
      url: baseURL,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_API_TARGET: "http://localhost:4100" },
      stdout: "pipe",
      stderr: "pipe"
    }
  ]
});

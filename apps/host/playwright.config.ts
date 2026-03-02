import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://127.0.0.1:${PORT}`;

const hostWebServer = {
  command: `node ../../node_modules/next/dist/bin/next dev --port ${PORT} --hostname 127.0.0.1`,
  url: `${baseURL}`,
  reuseExistingServer: true,
  stdout: "pipe" as const,
  stderr: "pipe" as const,
  timeout: 320_000,
};

const webServer = hostWebServer;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 320_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "singlepage",
      testDir: "./e2e/singlepage",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "startup",
      testDir: "./e2e/startup",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer,
});

import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

function getChromiumExecutablePath(): string | undefined {
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (configuredPath) return configuredPath;
  if (process.platform !== "win32") return undefined;

  const installationRoots = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.LOCALAPPDATA,
  ].filter((root): root is string => Boolean(root));

  return installationRoots
    .map((root) => join(root, "Google", "Chrome", "Application", "chrome.exe"))
    .find(existsSync);
}

const executablePath = getChromiumExecutablePath();

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./.next/playwright-test-results",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // The form is gated on client configuration; validation tests do not contact Firebase.
      NEXT_PUBLIC_FIREBASE_API_KEY: "playwright-unused-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ai-deta-464d4",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "ai-deta-464d4.firebasestorage.app",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "0",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:0:web:playwright",
    },
  },
});

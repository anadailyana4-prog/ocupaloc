import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/billing.test.ts",
      "tests/owner-portal.test.ts",
      "tests/reminder-schedule.test.ts",
      "tests/send-reminders-concurrency.test.ts"
    ],
    exclude: ["node_modules/", "dist/", ".next/", "tests/e2e/**"],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/tests/helpers/setup.ts"],
    include: ["src/**/*.test.ts"],
    sequence: { concurrent: false },
    pool: "forks",
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});

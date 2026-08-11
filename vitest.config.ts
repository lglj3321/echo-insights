import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts"],
    // Routes are registered once onto a shared app instance, so the files
    // cannot run in parallel against each other.
    fileParallelism: false,
  },
});

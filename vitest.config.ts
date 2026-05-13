import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "build", ".shopify"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "app/billing/**/*.ts",
        "app/lib/**/*.ts",
        "app/models/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.d.ts",
      ],
    },
  },
});

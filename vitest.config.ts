import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["test/setup.ts"],
    deps: {
      interopDefault: true,
    },
    reporters: ["default", ["junit", { outputFile: "coverage/junit.xml" }]],
    include: ["test/**/*.test.ts"],
    exclude: [
      "../node_modules/**",
      "../cdk.out/**",
      "../coverage/**",
      "../dist/**",
      "../.serverless/**",
    ],
    coverage: {
      provider: "v8",
      enabled: true,
      reporter: ["text", "json-summary"],
      reportOnFailure: true, // This ensures coverage is reported even on test failures
      reportsDirectory: "coverage",
      include: ["src-lambda/**/*.ts"],
      exclude: [
        "src-lambda/**/*.test.ts",
        "src-lambda/**/*.spec.ts",
        "src-lambda/**/*.d.ts",
        "src-lambda/**/types/**",
        "src-lambda/**/*.interface.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  plugins: [react()],
  //  root: "./src-site",
  build: {
    outDir: "../dist",
  },
});

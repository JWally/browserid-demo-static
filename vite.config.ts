import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    deps: {
      interopDefault: true,
    },
    reporters: ["default", ["junit", { outputFile: "./coverage/junit.xml" }]],
    include: ["test/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "cdk.out/**",
      "coverage/**",
      "dist/**",
      ".serverless/**",
    ],
    coverage: {
      provider: "v8",
      enabled: true,
      reporter: ["text", "json-summary"],
      reportOnFailure: true, // This ensures coverage is reported even on test failures
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.d.ts",
        "src/**/types/**",
        "src/**/*.interface.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});

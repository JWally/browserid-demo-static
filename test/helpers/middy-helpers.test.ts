import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Adjust the import paths according to your project structure
import { isWarmingUp, onWarmup } from "../../src-lambda/helpers/middy-helpers";
import { getAwsSecrets } from "../../src-lambda/services/get-aws-secrets";

// Mock the getAwsSecrets service
vi.mock("../../src/services/get-aws-secrets", () => ({
  getAwsSecrets: vi.fn(),
}));

describe("isWarmingUp", () => {
  it('returns true when event.source is "serverless-plugin-warmup"', () => {
    const event = { source: "serverless-plugin-warmup" };
    expect(isWarmingUp(event)).toBe(true);
  });

  it('returns true when event.source is "warmup-plugin"', () => {
    const event = { source: "warmup-plugin" };
    expect(isWarmingUp(event)).toBe(true);
  });

  it("returns true when event.warmup is true", () => {
    const event = { source: "any-source", warmup: true };
    expect(isWarmingUp(event)).toBe(true);
  });

  it("returns false when neither condition is met", () => {
    const event = { source: "some-other-source", warmup: false };
    expect(isWarmingUp(event)).toBe(false);
  });
});

describe("onWarmup", () => {
  // Reset mocks before each test to ensure test isolation.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs success when getAwsSecrets resolves", async () => {
    // Ensure the mock resolves successfully
    (getAwsSecrets as Mock).mockResolvedValue(undefined);

    // Spy on console.log and suppress actual logging during tests
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await onWarmup();

    expect(getAwsSecrets).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("Warmup completed successfully");
  });

  it("logs error when getAwsSecrets rejects", async () => {
    // Create an error and have the mock reject
    const error = new Error("Test error");
    (getAwsSecrets as Mock).mockRejectedValue(error);

    // Spy on console.error and suppress actual logging during tests
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await onWarmup();

    expect(getAwsSecrets).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("Warmup failed:", { error });
  });
});

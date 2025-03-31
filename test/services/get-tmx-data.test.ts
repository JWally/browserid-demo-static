import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the getAwsSecrets function so we can control the returned secrets
vi.mock("../../src-lambda/services/get-aws-secrets", () => ({
  getAwsSecrets: vi.fn(),
}));

// If you want to mock the Powertools logger calls, you can do so here.
// (Optional) For example:
vi.mock("@aws-lambda-powertools/logger", () => {
  return {
    Logger: vi.fn().mockImplementation(() => ({
      info: vi.fn(),
      error: vi.fn(),
    })),
  };
});

import { getAwsSecrets } from "../../src-lambda/services/get-aws-secrets";
import { getTmxData } from "../../src-lambda/services/get-tmx-data";

describe("getTmxData", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Stub the global fetch with a jest/vi mock
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    // Clear all calls to the getAwsSecrets mock
    (getAwsSecrets as any).mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("should fetch and return data successfully", async () => {
    // 1) Mock the AWS secrets
    (getAwsSecrets as any).mockResolvedValue({
      TMX_API_KEY: "TEST_API_KEY",
      TMX_ORG_ID: "TEST_ORG_ID",
    });

    // 2) Mock a successful fetch response
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ some: "data" }),
    });

    // 3) Call the function under test
    const result = await getTmxData("my-session-id");

    // 4) Verify getAwsSecrets was called and fetch used correct URL
    expect(getAwsSecrets).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      // The exact URL your code constructs:
      "https://h-api.online-metrix.net/api/session-query?" +
        "org_id=TEST_ORG_ID&" +
        "api_key=TEST_API_KEY&" +
        "session_id=my-session-id&" +
        "service_type=session-policy&" +
        "output_format=json",
    );

    // 5) Check the final result
    expect(result).toEqual({ some: "data" });
  });

  it("should throw if response is not OK (non-200)", async () => {
    (getAwsSecrets as any).mockResolvedValue({
      TMX_API_KEY: "TEST_API_KEY",
      TMX_ORG_ID: "TEST_ORG_ID",
    });

    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    // We expect getTmxData to reject with an error
    await expect(getTmxData("my-session-id")).rejects.toThrow(
      "Failed to fetch ThreatMetrix data: 403 Forbidden",
    );
  });

  it("should bubble up fetch network errors", async () => {
    (getAwsSecrets as any).mockResolvedValue({
      TMX_API_KEY: "TEST_API_KEY",
      TMX_ORG_ID: "TEST_ORG_ID",
    });

    fetchMock.mockRejectedValue(new Error("Network error"));

    await expect(getTmxData("my-session-id")).rejects.toThrow("Network error");
  });
});

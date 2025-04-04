import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getServerPublicIp,
  _resetCachedPublicIp,
} from "../../src-lambda/services/get-server-public-ip"; // Adjust import path as needed
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { GRPC_SERVER_INSTANCE_ID } from "../../src-lambda/helpers/constants";

// Mock the AWS SDK
vi.mock("@aws-sdk/client-ec2", () => {
  const mockSend = vi.fn();
  return {
    EC2Client: vi.fn(() => ({
      send: mockSend,
    })),
    DescribeInstancesCommand: vi.fn(),
  };
});

describe("getServerPublicIp", () => {
  const mockPublicIp = "54.123.45.67";
  const mockInstanceId = "i-mock12345";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset the module to clear the cached IP between tests
    _resetCachedPublicIp();
    vi.resetModules();
  });

  it("returns the public IP when available", async () => {
    const mockResponse = {
      Reservations: [
        {
          Instances: [
            {
              InstanceId: mockInstanceId,
              PublicIpAddress: mockPublicIp,
            },
          ],
        },
      ],
    };

    // Arrange: mock AWS call
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockResolvedValueOnce(mockResponse);

    // Act
    const result = await getServerPublicIp(mockInstanceId);

    // Assert
    expect(DescribeInstancesCommand).toHaveBeenCalledWith({
      InstanceIds: [mockInstanceId],
    });
    expect(mockEC2Client.send).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockPublicIp);
  });

  it("uses default instance ID when no ID is provided", async () => {
    const mockResponse = {
      Reservations: [
        {
          Instances: [
            {
              InstanceId: GRPC_SERVER_INSTANCE_ID,
              PublicIpAddress: mockPublicIp,
            },
          ],
        },
      ],
    };

    // Arrange
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockResolvedValueOnce(mockResponse);

    // Act
    const result = await getServerPublicIp();

    // Assert
    expect(DescribeInstancesCommand).toHaveBeenCalledWith({
      InstanceIds: [GRPC_SERVER_INSTANCE_ID],
    });
    expect(result).toBe(mockPublicIp);
  });

  it("caches the IP for subsequent calls", async () => {
    const mockResponse = {
      Reservations: [
        {
          Instances: [
            {
              InstanceId: mockInstanceId,
              PublicIpAddress: mockPublicIp,
            },
          ],
        },
      ],
    };

    // Arrange
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockResolvedValueOnce(mockResponse);

    // Act
    const result1 = await getServerPublicIp(mockInstanceId);
    const result2 = await getServerPublicIp(mockInstanceId);

    // Assert
    expect(mockEC2Client.send).toHaveBeenCalledTimes(1);
    expect(result1).toBe(mockPublicIp);
    expect(result2).toBe(mockPublicIp);
  });

  it("throws when no public IP is found", async () => {
    const mockResponse = {
      Reservations: [
        {
          Instances: [
            {
              InstanceId: mockInstanceId,
              // No PublicIpAddress
            },
          ],
        },
      ],
    };

    // Arrange
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockResolvedValueOnce(mockResponse);

    // Act & Assert
    await expect(getServerPublicIp(mockInstanceId)).rejects.toThrow(
      `No public IP found for instance "${mockInstanceId}"`,
    );
  });

  it("throws when no instances are found at all", async () => {
    const mockResponse = {
      Reservations: [],
    };

    // Arrange
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockResolvedValueOnce(mockResponse);

    // Act & Assert
    await expect(getServerPublicIp(mockInstanceId)).rejects.toThrow(
      `No public IP found for instance "${mockInstanceId}"`,
    );
  });

  it("throws if AWS call fails", async () => {
    const mockError = new Error("AWS error");
    const mockEC2Client = new EC2Client() as unknown as {
      send: ReturnType<typeof vi.fn>;
    };
    mockEC2Client.send.mockRejectedValueOnce(mockError);

    await expect(getServerPublicIp(mockInstanceId)).rejects.toThrow(
      "AWS error",
    );
    expect(mockEC2Client.send).toHaveBeenCalledTimes(1);
  });
});

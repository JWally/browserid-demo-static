// file: getPublicIp.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstancesCommandOutput,
} from "@aws-sdk/client-ec2";
import { GRPC_SERVER_INSTANCE_ID } from "../helpers/constants";

/**
 * An in-memory cache for the instance's public IP.
 * It will persist as long as the Lambda container is "warm."
 */
let cachedPublicIp: string | null = null;

/**
 * Create an EC2 client (modify region, credentials, etc. as needed).
 */
const ec2Client = new EC2Client({ region: "us-east-1" });

/**
 * Fetches and caches the public IP of a given EC2 instance.
 *
 * @param instanceId - The instance ID for which you want to retrieve the public IP.
 *        Defaults to "i-000ed52de0c80c202".
 * @returns The public IP address as a string.
 * @throws If the specified instance does not have a public IP address or cannot be found.
 */
export async function getServerPublicIp(
  instanceId: string = GRPC_SERVER_INSTANCE_ID,
): Promise<string> {
  // Return cached IP if it's already fetched during this Lambda container's lifetime.
  if (cachedPublicIp) {
    return cachedPublicIp;
  }

  // Describe the instance(s) using the provided instance ID.
  const response: DescribeInstancesCommandOutput = await ec2Client.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    }),
  );

  // The returned object may contain multiple reservations, each with one or more instances.
  if (response.Reservations) {
    for (const reservation of response.Reservations) {
      if (reservation.Instances) {
        for (const instance of reservation.Instances) {
          // Check for PublicIpAddress
          if (instance.PublicIpAddress) {
            cachedPublicIp = instance.PublicIpAddress;
            return cachedPublicIp;
          }
        }
      }
    }
  }

  // If no public IP was found, throw an error.
  throw new Error(`No public IP found for instance "${instanceId}"`);
}

/**
 * Only used in tests. Clears the cached IP address.
 */
export function _resetCachedPublicIp() {
  cachedPublicIp = null;
}

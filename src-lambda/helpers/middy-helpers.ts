import { getAwsSecrets } from "../services/get-aws-secrets";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { MiddlewareObj } from "@middy/core";
import { LRUCache } from "lru-cache";
import createError from "http-errors";

interface MiddyEvent {
  source: string;
  warmup?: boolean;
}

export const isWarmingUp = (event: MiddyEvent) => {
  return (
    event.source === "serverless-plugin-warmup" ||
    event.source === "warmup-plugin" ||
    event?.warmup === true
  );
};

export const onWarmup = async () => {
  try {
    await getAwsSecrets();
    console.log("Warmup completed successfully");
  } catch (error) {
    console.error("Warmup failed:", { error });
  }
};

// 1. Define ONE global LRU cache instance
const cache = new LRUCache<string, number>({
  max: 1000,
  ttl: 30_000,
});

/**
 * 2. Helper to clear the LRU cache.
 *    Does not return anything. Just a side-effect.
 */
export const _clearDeduplicateCache = (): void => {
  cache.clear();
};

/**
 * 3. Deduplicate middleware that uses the same `cache` above.
 */
export const deduplicateMiddleware = (): MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  return {
    before: (request) => {
      const { event } = request;

      // If no body, no deduplication needed
      if (!event.body) return;

      // Use the first 256 characters as the cache key
      const key = event.body.slice(0, 256);

      // If we already have this key, reject with 429
      if (cache.has(key)) {
        // Add up how many times its been hit
        const catchCount: number = cache.get(key) || 0;

        // Set the new number
        cache.set(key, 1 + catchCount);

        // If count % 15 === 0, we should add to WAF/Firewall
        throw new createError.TooManyRequests(
          `Duplicate request detected: ${catchCount + 1}`,
        );
      }

      // Otherwise, set the key in the cache to prevent future duplicates
      cache.set(key, 1);
    },
  };
};

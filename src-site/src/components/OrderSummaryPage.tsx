import React, { useEffect, useState } from "react";
import {
  OAK_BUCKET_URL,
  TMX_BUCKET_URL,
  TRACKER_BUCKER_URL,
} from "../utils/constants";
import { getSessionId } from "../utils/helpers";

// Helper function: attempts to fetch JSON up to `attempts` times over ~totalDelayMs.
async function fetchJsonWithRetries(
  url: string,
  attempts = 12,
  totalDelayMs = 3000,
) {
  const delayBetweenAttempts = totalDelayMs / attempts;

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // If last attempt, rethrow
      if (i === attempts - 1) {
        throw error;
      }
      // Otherwise, wait and try again
      await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts));
    }
  }
}

function OrderSummaryPage() {
  const sessionId = getSessionId();
  const [tmxData, setTmxData] = useState(null);
  const [oakData, setOakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      try {
        // Attempt both calls in parallel
        const [tmxJson, oakJson] = await Promise.all([
          fetchJsonWithRetries(`${TMX_BUCKET_URL}${sessionId}.json`),
          fetchJsonWithRetries(`${OAK_BUCKET_URL}${sessionId}.json`),
        ]);

        if (!isCancelled) {
          setTmxData(tmxJson);
          setOakData(oakJson);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching data:", err);
          //@ts-expect-error todo:cleanup
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  // --- TMX: "TMX_DATA.device_id" is a plain string ---
  const tmxDeviceId =
    tmxData && typeof tmxData["TMX_DATA.device_id"] === "string"
      ? tmxData["TMX_DATA.device_id"]
      : "Data not available";

  // --- OAK: "OAK_DATA.profile_data.device_id" is an object with a .value ---
  const oakDeviceId =
    //@ts-expect-error todo: fix
    oakData?.OAK_DATA?.profile_data?.device_id?.value ?? "Data not available";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-pink-500">
        Thanks for Your Order!
      </h1>
      <p className="text-gray-300 mb-4">
        Your session ID is: <strong>{sessionId}</strong>
      </p>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {loading ? (
        // Loading skeleton while we wait for data (and potential retries).
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        </div>
      ) : (
        <>
          <p className="text-gray-300 mb-4">
            TMX-ID: <strong>{tmxDeviceId}</strong>
          </p>
          <p className="text-gray-300 mb-4">
            OAK-ID: <strong>{oakDeviceId}</strong>
          </p>
        </>
      )}

      <div className="flex flex-col space-y-4">
        <a
          href={`${TMX_BUCKET_URL}${sessionId}.json`}
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-1/3 text-center bg-pink-600 text-white px-12 py-2 rounded hover:bg-pink-700 transition-colors font-mono"
        >
          TMX
        </a>
        <a
          href={`${OAK_BUCKET_URL}${sessionId}.json`}
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-1/3 text-center bg-pink-600 text-white px-12 py-2 rounded hover:bg-pink-700 transition-colors font-mono"
        >
          OAK-USED
        </a>
        <a
          href={`${TRACKER_BUCKER_URL}${sessionId}.json`}
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-1/3 text-center bg-pink-600 text-white px-12 py-2 rounded hover:bg-pink-700 transition-colors font-mono"
        >
          OAK-AVAILABLE
        </a>
      </div>
    </div>
  );
}

export default OrderSummaryPage;

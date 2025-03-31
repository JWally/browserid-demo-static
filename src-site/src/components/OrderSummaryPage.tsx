import React from "react";
import { OAK_BUCKET_URL, TMX_BUCKET_URL } from "../utils/constants";
import { getSessionId } from "../utils/helpers";

function OrderSummaryPage() {
  // Retrieve session ID from sessionStorage
  const sessionId = getSessionId();

  const handleClear = () => {
    // For instance, remove the session id and reload the page
    sessionStorage.removeItem("session-id");
    window.location.assign("/");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-pink-500">
        Thanks for Your Order!
      </h1>
      <p className="text-gray-300 mb-4">
        We appreciate your purchase. Your session ID (for now) is:{" "}
        <strong>{sessionId}</strong>
      </p>
      <p className="text-gray-300 mb-4">Your Order Details Below:</p>
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
          OAK
        </a>
        <button
          type="button"
          onClick={handleClear}
          className="w-full md:w-1/3 text-center bg-pink-600 text-white px-12 py-2 rounded hover:bg-pink-700 transition-colors font-mono"
        >
          START OVER
        </button>
      </div>
    </div>
  );
}

export default OrderSummaryPage;

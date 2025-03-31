// src/components/AdBlockModal.tsx

import React from "react";

export default function AdBlockModal() {
  const handleReload = () => {
    // Optionally reload the page or navigate them somewhere else
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-pink-500 mb-4">
          Ad Blocker Detected
        </h2>
        <p className="text-white mb-6">
          Our site relies on certain scripts to provide a secure and complete
          experience. Please disable your ad blocker and reload the page.
        </p>
        <button
          onClick={handleReload}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

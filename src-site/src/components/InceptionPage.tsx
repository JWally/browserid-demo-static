// src/components/InceptionPage.tsx

import React from "react";

function InceptionPage() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/"
        title="Inception"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export default InceptionPage;

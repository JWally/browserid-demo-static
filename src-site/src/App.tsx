import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CartPage from "./components/CartPage";
import ProductPage from "./components/ProductPage";
import OrderSummaryPage from "./components/OrderSummaryPage";
import { CartProvider } from "./context/CartContext";
import { profileTMX, profileOAK } from "./utils/profiler";
import { getSessionId } from "./utils/helpers";
import AdBlockModal from "./components/AdBlockModal";

const App = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const handlePopstate = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    // Listen for the custom event
    const handleTmxScriptError = () => {
      setAdBlockDetected(true);
    };
    document.addEventListener("tmx-script-error", handleTmxScriptError);

    return () => {
      document.removeEventListener("tmx-script-error", handleTmxScriptError);
    };
  }, [path, sessionId]);

  // When to profile...
  if (path.startsWith("/cart")) {
    profileTMX(sessionId, 22);
    profileOAK(sessionId, "false", "true");
  } else {
    profileTMX(sessionId, 22);
    profileOAK(sessionId, "true", "false");
  }

  let Component = HomePage;
  if (path.startsWith("/product/")) {
    Component = () => (
      <ProductPage productId={parseInt(path.split("/")[2], 10)} />
    );
  } else if (path === "/cart") {
    Component = CartPage;
  } else if (path === "/order-summary") {
    Component = OrderSummaryPage;
  }

  return (
    <CartProvider>
      {adBlockDetected && <AdBlockModal />}
      <Navbar />
      <Component />
    </CartProvider>
  );
};

export default App;

import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CartPage from "./components/CartPage";
import ProductPage from "./components/ProductPage";
import OrderSummaryPage from "./components/OrderSummaryPage";
import { CartProvider } from "./context/CartContext";
import { profileTMX } from "./utils/profiler";
import { getSessionId } from "./utils/helpers";

const App = () => {
  const [path, setPath] = useState(window.location.pathname);

  const sessionId = getSessionId();

  useEffect(() => {
    const handlePopstate = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    profileTMX(sessionId, 22);
  }, [path, sessionId]);

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
      <Navbar />
      <Component />
    </CartProvider>
  );
};

export default App;

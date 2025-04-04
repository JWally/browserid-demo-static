import React, { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { getSessionId } from "../utils/helpers";
import { DEMO_API_URL } from "../utils/constants";

//@ts-expect-error fix-later
function CartPage(): JSX.Element {
  const { cart, removeFromCart, updateQuantity, getCartTotal, emptyCart } =
    useContext(CartContext)!;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const sessionId = getSessionId();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await fetch(DEMO_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" }, // ...browserInfo },
        body: JSON.stringify({ "session-id": sessionId }),
      });

      // B) Redirect to the "order-summary" page
      window.history.pushState({}, "", "/order-summary");

      window.dispatchEvent(new PopStateEvent("popstate"));

      emptyCart();

      setTimeout(() => {
        sessionStorage.removeItem("session-id");
      }, 3_000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-1 mt-2 text-center">
        <h1 className="text-3xl font-bold mb-2 text-pink-500">
          Your Cart Is Empty Inside
        </h1>
        <div className="mt-2">
          <div className="clown-container">
            <div className="clown-overlay"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-pink-500">
        ...Just Buy It Already
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-pink-300">
            Order Info (Like it even matters...)
          </h2>
          <div className="border-t border-gray-700 pt-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center mb-4"
              >
                <div>
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <p className="text-gray-400">${item.price}</p>
                  <div className="flex items-center mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-700 px-2 rounded text-white"
                    >
                      -
                    </button>
                    <span className="mx-2 text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-700 px-2 rounded text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-600 text-white">
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>

          <form style={{ marginTop: "20px" }}>
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-full bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PURCHASE
            </button>
            <button
              onClick={() => emptyCart()}
              className="w-full bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-5"
            >
              EMPTY CART
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CartPage;

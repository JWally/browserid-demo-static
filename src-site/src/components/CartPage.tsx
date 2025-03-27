import React, { useState, useContext, FormEvent } from "react";
import { CartContext } from "../context/CartContext";
import Link from "./Link";
import { getSessionId } from "../utils/helpers";

//@ts-expect-error fix-later
function CartPage(): JSX.Element {
  const { cart, removeFromCart, updateQuantity, getCartTotal, emptyCart } =
    useContext(CartContext)!;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const sessionId = getSessionId();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      await fetch("https://api-dev-jw.browserid.info/v1/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ "session-id": sessionId }),
      });

      // B) Redirect to the "order-summary" page
      window.history.pushState({}, "", "/order-summary");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-pink-500">Your Cart</h1>
        <p>It's sad and void...</p>
        <p>
          <Link to="/" className="text-pink-400 hover:underline">
            Go back
          </Link>{" "}
          and fill your cart until you can feel happiness again...
        </p>
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

          <form style={{ marginTop: "20px" }} onSubmit={handleSubmit}>
            <button
              type="submit"
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

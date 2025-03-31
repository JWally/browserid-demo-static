import React, { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { products } from "../utils/products";
import Notification from "./Notification";

interface ProductPageProps {
  productId: number;
}

//@ts-expect-error fix-later
function ProductPage({ productId }: ProductPageProps): JSX.Element {
  const { addToCart } = useContext(CartContext)!;
  const product = products.find((p) => p.id === productId);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  if (!product) {
    return (
      <div>
        Product not found. One more thing you've failed at - great job...
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });

    setShowNotification(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showNotification && (
        <Notification
          message="The item has been added to your cart."
          onClose={() => setShowNotification(false)}
          type="success"
          duration={3000}
          link="/cart"
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <img
          src={product.image}
          alt={product.name}
          className="w-full rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold mb-4 text-pink-500">
            {product.name}
          </h1>
          <p className="text-2xl text-white mb-4">${product.price}</p>
          <p className="text-gray-400 mb-6">{product.description}</p>
          <button
            onClick={handleAddToCart}
            className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;

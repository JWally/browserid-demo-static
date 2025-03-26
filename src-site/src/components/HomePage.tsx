import React from "react";
import Link from "./Link";
import { products } from "../utils/products";

//@ts-expect-error fix-later
function HomePage(): JSX.Element {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-pink-500">
        Wicked Fashion at Sinfully Low Prices!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-4 flex-grow flex flex-col">
              <h2 className="text-xl font-semibold text-pink-300">
                {product.name}
              </h2>
              <p className="text-gray-400 mb-2">${product.price}</p>
              <div className="mt-auto">
                <Link
                  to={`/product/${product.id}`}
                  className="inline-block bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors"
                >
                  Embrace the Sadness
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;

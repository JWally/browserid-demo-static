import React, { useContext } from "react";
import Link from "./Link";
import { CartContext } from "../context/CartContext";

const Navbar = () => {
  const { cart } = useContext(CartContext)!;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex justify-between h-16 items-center">
        <Link to="/" className="font-bold text-xl text-pink-500">
          BotTopic
        </Link>
        <div className="space-x-4">
          <Link to="/" className="text-gray-300 hover:text-pink-400">
            Home
          </Link>
          <Link
            to="/category/outerwear"
            className="text-gray-300 hover:text-pink-400"
          >
            Outerwear
          </Link>
          <Link to="/cart" className="text-gray-300 hover:text-pink-400">
            Cart({itemCount})
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

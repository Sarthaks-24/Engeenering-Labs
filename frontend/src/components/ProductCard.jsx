import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ProductCard({ product }) {
  const [saving, setSaving] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  const handleAddWishlist = async () => {
    try {
      setSaving(true);
      setWishlistError("");

      await api.post(`/wishlist/${product._id}`);

      setWishlistAdded(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlistError(
          "Product is already in your wishlist."
        );
      } else {
        setWishlistError(
          "Unable to save product. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">

      <img
        src={product.image}
        alt={product.name}
        className="w-full h-52 object-cover"
      />

      <div className="p-4">

        <h2 className="text-xl font-semibold text-gray-800">
          {product.name}
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {product.category}
        </p>

        <p className="text-xl font-bold text-gray-900 mt-2">
          ₹{product.price}
        </p>

        <p className="text-sm text-gray-600 mt-1">
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <Link
          to={`/products/${product._id}`}
          className="block text-center mt-4 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900"
        >
          View Details
        </Link>

        <button
          onClick={handleAddWishlist}
          disabled={saving || wishlistAdded}
          className="w-full mt-3 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-60"
        >
          {saving
            ? "⏳ Saving..."
            : wishlistAdded
            ? "♥ Added to Wishlist"
            : "♡ Add to Wishlist"}
        </button>

        {wishlistError && (
          <p className="text-sm text-red-500 mt-2">
            {wishlistError}
          </p>
        )}

      </div>
    </div>
  );
}

export default ProductCard;
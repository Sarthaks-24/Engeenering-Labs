
import { Link } from "react-router-dom";

function WishlistCard({ product, onRemove, removing }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-52 object-cover"
      />

      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800">
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

        <div className="flex gap-2 mt-4">
          <Link
            to={`/products/${product._id}`}
            className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            View Details
          </Link>

          <button
            onClick={() => onRemove(product._id)}
            disabled={removing}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WishlistCard;
import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <img
        src={product.image}
        alt={product.name}
        className="h-52 w-full object-cover"
      />

      <div className="p-5">
        <p className="mb-2 text-sm font-medium text-blue-600">
          {product.category}
        </p>

        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {product.name}
        </h2>

        <p className="mb-3 text-2xl font-bold text-gray-900">
          ₹{product.price}
        </p>

        <p
          className={`mb-4 text-sm font-medium ${
            product.stock > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <Link
          to={`/products/${product._id}`}
          className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
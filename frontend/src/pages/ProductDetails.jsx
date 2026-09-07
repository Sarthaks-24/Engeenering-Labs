import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct } from "../services/api";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProduct(id);

        setProduct(data);
      } catch (err) {
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-600">
          Loading product...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        <Link
          to="/products"
          className="mb-6 inline-block font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Products
        </Link>

        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-2">

          {/* Image */}
          <div className="bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="h-full max-h-[600px] w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center p-8">

            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
              {product.category}
            </p>

            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="mb-6 leading-relaxed text-gray-600">
              {product.description}
            </p>

            <p className="mb-4 text-3xl font-bold text-gray-900">
              ₹{product.price}
            </p>

            <p
              className={`mb-8 font-medium ${
                product.stock > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {product.stock > 0
                ? `${product.stock} units available`
                : "Out of stock"}
            </p>

            <button
              disabled={product.stock === 0}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Add to Cart
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct } from "../services/api";
import api from "../services/api";
import CartContext from "../context/CartContext";
import Navbar from "../components/Navbar";

function ProductDetails() {
  const { id } = useParams();
  const { addCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart action states
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState("");

  // Wishlist action states
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [wishlistSuccess, setWishlistSuccess] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProduct(id);
        setProduct(data);
      } catch {
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check if product is in user's wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const response = await api.get("/wishlist");
        if (response.data?.wishlist) {
          const found = response.data.wishlist.some(
            (item) => (item._id || item) === id
          );
          setIsInWishlist(found);
        }
      } catch {
        // Unauthenticated or wishlist empty, ignore
      }
    };

    if (id) {
      checkWishlistStatus();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;

    try {
      setAddingToCart(true);
      setCartError("");
      setCartSuccess(false);

      const result = await addCart(product._id);

      if (result && result.success === false) {
        if (result.status === 401) {
          setCartError("Please log in to add items to your cart.");
        } else {
          setCartError(result.error || "Unable to add product to cart.");
        }
      } else {
        setCartSuccess(true);
        setTimeout(() => setCartSuccess(false), 4000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setCartError("Please log in to add items to your cart.");
      } else {
        setCartError(
          err.response?.data?.error || "Unable to add product to cart."
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      setSavingWishlist(true);
      setWishlistError("");
      setWishlistSuccess("");

      if (isInWishlist) {
        await api.delete(`/wishlist/${product._id}`);
        setIsInWishlist(false);
        setWishlistSuccess("Removed from your wishlist.");
        setTimeout(() => setWishlistSuccess(""), 3000);
      } else {
        await api.post(`/wishlist/${product._id}`);
        setIsInWishlist(true);
        setWishlistSuccess("Added to your wishlist!");
        setTimeout(() => setWishlistSuccess(""), 3000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistError("Please log in to save items to your wishlist.");
      } else if (err.response?.status === 409) {
        setIsInWishlist(true);
        setWishlistError("Product is already in your wishlist.");
      } else {
        setWishlistError(
          err.response?.data?.error ||
            "Unable to update wishlist. Please try again."
        );
      }
    } finally {
      setSavingWishlist(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center bg-gray-100">
          <p className="text-lg font-medium text-gray-600">
            Loading product details...
          </p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 bg-gray-100 px-6">
          <p className="text-lg font-medium text-red-600">{error}</p>
          <Link
            to="/products"
            className="rounded-lg bg-gray-800 px-6 py-2.5 font-medium text-white transition hover:bg-gray-900"
          >
            ← Back to Products
          </Link>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 bg-gray-100 px-6">
          <p className="text-lg font-medium text-gray-600">Product not found.</p>
          <Link
            to="/products"
            className="rounded-lg bg-gray-800 px-6 py-2.5 font-medium text-white transition hover:bg-gray-900"
          >
            ← Back to Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/products"
            className="mb-6 inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Products
          </Link>

          <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-2">
            {/* Image */}
            <div className="bg-gray-50 flex items-center justify-center p-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-full max-h-125 w-full object-cover rounded-xl"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                {product.category}
              </p>

              <h1 className="mb-3 text-3xl sm:text-4xl font-bold text-gray-900">
                {product.name}
              </h1>

              <p className="mb-5 leading-relaxed text-gray-600 text-sm sm:text-base">
                {product.description}
              </p>

              <p className="mb-3 text-3xl font-bold text-gray-900">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </p>

              <p
                className={`mb-6 font-medium ${
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stock > 0
                  ? `${product.stock} units available`
                  : "Out of stock"}
              </p>

              {/* Feedback Notifications */}
              {cartSuccess && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  <span>✓ Added to your cart successfully!</span>
                  <Link
                    to="/cart"
                    className="font-semibold underline hover:text-green-900 ml-2"
                  >
                    View Cart →
                  </Link>
                </div>
              )}

              {cartError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {cartError}
                </div>
              )}

              {wishlistSuccess && (
                <div className="mb-4 rounded-lg bg-pink-50 border border-pink-200 px-4 py-3 text-sm text-pink-700">
                  {wishlistSuccess}
                </div>
              )}

              {wishlistError && (
                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  {wishlistError}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 shadow cursor-pointer text-center"
                >
                  {addingToCart
                    ? "Adding to Cart..."
                    : product.stock === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={savingWishlist}
                  className={`w-full rounded-lg px-6 py-3 font-semibold transition border cursor-pointer ${
                    isInWishlist
                      ? "bg-pink-50 border-pink-500 text-pink-700 hover:bg-pink-100"
                      : "bg-white border-pink-500 text-pink-600 hover:bg-pink-50"
                  } disabled:opacity-60`}
                >
                  {savingWishlist
                    ? "⏳ Updating Wishlist..."
                    : isInWishlist
                    ? "♥ In Wishlist (Click to Remove)"
                    : "♡ Add to Wishlist"}
                </button>
              </div>

              {/* Quick links */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500">
                <Link
                  to="/cart"
                  className="hover:text-blue-600 transition"
                >
                  Go to Shopping Cart
                </Link>
                <Link
                  to="/wishlist"
                  className="hover:text-pink-600 transition"
                >
                  View My Wishlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetails;
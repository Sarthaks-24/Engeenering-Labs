import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import WishlistCard from "../components/WishlistCard";
import Navbar from "../components/Navbar";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");

      setWishlist(response.data.wishlist);
    } catch (err) {
      setError("Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);

      await api.delete(`/wishlist/${productId}`);

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (product) => product._id !== productId
        )
      );
    } catch (err) {
      alert("Unable to remove product from wishlist.");
    } finally {
      setRemovingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
      {/* Header */}
              <div>
              <Navbar/>
              </div>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading your wishlist...
        </p>
      </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
      {/* Header */}
              <div>
              <Navbar/>
              </div>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Something went wrong.
        </h1>

        <p className="text-gray-500">
          {error}
        </p>

        <button
          onClick={fetchWishlist}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
      </>
    );
  }

  // Empty state
  if (wishlist.length === 0) {
    return (
      <>
      {/* Header */}
              <div>
              <Navbar/>
              </div>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">
          ❤️
        </div>

        <h1 className="text-2xl font-bold text-gray-800">
          Your wishlist is empty
        </h1>

        <p className="text-gray-500 mt-2">
          Save products you love and find them here later.
        </p>

        <Link
          to="/products"
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
      </>
    );
  }

  // Wishlist
  return (
    <>
    {/* Header */}
        <div>
        <Navbar/>
        </div>
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            My Wishlist
          </h1>

          <p className="text-gray-500 mt-1">
            {wishlist.length}{" "}
            {wishlist.length === 1 ? "product" : "products"} saved
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
              removing={removingId === product._id}
            />
          ))}
        </div>

      </div>
    </div>
    </>
  );
}

export default Wishlist;
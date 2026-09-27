import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import CartContext from "../context/CartContext";
import Navbar from "../components/Navbar";

const formatPrice = (value) =>
  `₹${Number(value).toLocaleString("en-IN")}`;

function Cart() {
  const {
    cartItems,
    loading,
    error,
    updateCart,
    deleteCart,
    getCart,
  } = useContext(CartContext);

  useEffect(() => {
    getCart();
  }, [getCart]);

  const itemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleDecrease = (item) => {
    if (item.quantity === 1) {
      deleteCart(item.product._id);
      return;
    }

    updateCart(item.product._id, item.quantity - 1);
  };

  if (loading && cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading your cart...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Cart</h1>
            <p className="text-gray-500 mt-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          {error && (
            <p className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-700">
              {error}
            </p>
          )}

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mt-2">
                Add products to your cart to see them here.
              </p>
              <Link
                to="/products"
                className="inline-block mt-6 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
              <section className="bg-white rounded-xl shadow-md divide-y">
                {cartItems.map((item) => {
                  const product = item.product;

                  return (
                    <article
                      key={product._id}
                      className="p-5 sm:flex sm:items-center sm:gap-6"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg sm:w-36 sm:h-36"
                      />

                      <div className="flex-1 mt-4 sm:mt-0">
                        <Link
                          to={`/products/${product._id}`}
                          className="text-xl font-semibold text-gray-800 hover:text-gray-600"
                        >
                          {product.name}
                        </Link>
                        <p className="text-gray-500 mt-1">
                          {formatPrice(product.price)} each
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item)}
                              disabled={loading}
                              aria-label={`Decrease ${product.name} quantity`}
                              className="px-3 py-2 text-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="min-w-10 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCart(product._id, item.quantity + 1)
                              }
                              disabled={loading || item.quantity >= product.stock}
                              aria-label={`Increase ${product.name} quantity`}
                              className="px-3 py-2 text-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <p className="font-bold text-gray-900 sm:ml-auto">
                            {formatPrice(product.price * item.quantity)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteCart(product._id)}
                          disabled={loading}
                          className="mt-4 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>

              <aside className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Order Summary
                </h2>
                <div className="mt-5 space-y-3 text-gray-600">
                  <div className="flex justify-between">
                    <span>Items</span>
                    <span>{itemCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-60"
                  disabled={loading}
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Cart;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/orders");
      if (res.data?.orders) {
        setOrders(res.data.orders);
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
            {!loading && !error && orders.length > 0 && (
              <p className="text-gray-500 mt-1">
                {orders.length} {orders.length === 1 ? "order" : "orders"} placed
              </p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <p className="text-lg text-gray-600">Loading your orders...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Something went wrong
              </h2>
              <p className="text-red-600 mt-2">{error}</p>
              <button
                type="button"
                onClick={fetchOrders}
                className="mt-6 bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-800">
                You have not placed any orders yet.
              </h2>
              <p className="text-gray-500 mt-2">
                Browse our catalog and make your first purchase!
              </p>
              <Link
                to="/products"
                className="inline-block mt-6 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition font-medium"
              >
                Start Shopping
              </Link>
            </div>
          )}

          {/* Orders list */}
          {!loading && !error && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <article
                  key={order._id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Order #{order._id}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PLACED" ||
                            order.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Status: {order.status || "PLACED"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6">
                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, idx) => (
                        <div
                          key={item.product || idx}
                          className="flex justify-between text-gray-700 text-sm sm:text-base"
                        >
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-lg font-bold text-gray-900">
                        Total: {formatPrice(order.totalAmount)}
                      </div>

                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-block bg-gray-800 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Orders;

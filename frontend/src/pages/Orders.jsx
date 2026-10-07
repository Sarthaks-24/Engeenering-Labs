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

const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const getStepIndex = (status) => {
  const index = STATUS_STEPS.indexOf(status);
  return index >= 0 ? index : 0;
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(
        "Failed to update status: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
                className="mt-6 bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition cursor-pointer"
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
              {orders.map((order) => {
                const currentStepIdx = getStepIndex(order.status);

                return (
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

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            order.status === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : order.status === "SHIPPED"
                              ? "bg-indigo-100 text-indigo-800"
                              : order.status === "CONFIRMED"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "PLACED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Status: {order.status || "PLACED"}
                        </span>
                      </div>
                    </div>

                    {/* Visual Status Progression Tracker */}
                    <div className="px-6 py-5 bg-slate-50 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center sm:text-left">
                        Order Progress
                      </p>
                      <div className="relative flex items-center justify-between max-w-xl mx-auto px-2">
                        {/* Static grey line */}
                        <div className="absolute top-3.5 left-6 right-6 h-1 bg-gray-200 -z-0" />

                        {/* Active blue progress line */}
                        <div
                          className="absolute top-3.5 left-6 h-1 bg-blue-600 transition-all duration-300 -z-0"
                          style={{
                            width: `${
                              (currentStepIdx / (STATUS_STEPS.length - 1)) * 88
                            }%`,
                          }}
                        />

                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;

                          return (
                            <div
                              key={step}
                              className="flex flex-col items-center relative z-10"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isCompleted
                                    ? "bg-green-600 text-white ring-4 ring-green-100"
                                    : isCurrent
                                    ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md animate-pulse"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                }`}
                              >
                                {isCompleted ? "✓" : idx + 1}
                              </div>
                              <span
                                className={`mt-1.5 text-[11px] font-semibold tracking-tight ${
                                  isCurrent
                                    ? "text-blue-700 font-bold"
                                    : isCompleted
                                    ? "text-green-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
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

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Dev / Admin Progression Tool */}
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
                            <span className="text-gray-500 font-medium">
                              Dev Status:
                            </span>
                            <select
                              value={order.status || "PLACED"}
                              onChange={(e) =>
                                handleStatusUpdate(order._id, e.target.value)
                              }
                              disabled={updatingId === order._id}
                              className="bg-white border border-gray-300 rounded px-1.5 py-0.5 font-semibold text-gray-800 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {STATUS_STEPS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Link
                            to={`/orders/${order._id}`}
                            className="inline-block bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Orders;

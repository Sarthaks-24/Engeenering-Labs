import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const getStepIndex = (status) => {
  const index = STATUS_STEPS.indexOf(status);
  return index >= 0 ? index : 0;
};

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    if (!order?._id) return;
    try {
      setUpdating(true);
      await api.patch(`/orders/${order._id}/status`, { status: newStatus });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      alert(
        "Failed to update status: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order || res.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading order details...</p>
        </main>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Order Not Found
            </h1>
            <p className="text-red-600 mt-2">{error || "Could not locate this order."}</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                to="/orders"
                className="bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition"
              >
                View My Orders
              </Link>
              <Link
                to="/products"
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const { shippingAddress, items = [], totalAmount, status, createdAt } = order;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Header / Success Banner */}
            <div className="p-8 text-center border-b border-gray-200 bg-emerald-50/50">
              <div className="text-5xl mb-3">✅</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Order Placed Successfully
              </h1>
              <p className="text-gray-600 mt-2">
                Your order has been saved successfully.
              </p>
            </div>

            {/* Quick Metadata Box */}
            <div className="p-6 border-b border-gray-200 bg-gray-50/50 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Order ID:</span>
                <span className="font-mono font-medium text-gray-900">
                  {order._id}
                </span>
              </div>
              {createdAt && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Placed On:</span>
                  <span>{formatDate(createdAt)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">Status:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-700">
                    {order.status || "PLACED"}
                  </span>
                  <select
                    value={order.status || "PLACED"}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="text-xs bg-white border border-gray-300 rounded px-1.5 py-0.5 font-semibold text-gray-800 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {STATUS_STEPS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between text-base border-t border-gray-200 pt-2 font-bold text-gray-900">
                <span>Total:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Visual Status Progression Tracker */}
            <div className="px-6 py-5 bg-slate-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center sm:text-left">
                Order Progress
              </p>
              <div className="relative flex items-center justify-between max-w-lg mx-auto px-2">
                <div className="absolute top-3.5 left-5 right-5 h-1 bg-gray-200 -z-0" />
                <div
                  className="absolute top-3.5 left-5 h-1 bg-blue-600 transition-all duration-300 -z-0"
                  style={{
                    width: `${
                      (getStepIndex(order.status) / (STATUS_STEPS.length - 1)) *
                      88
                    }%`,
                  }}
                />

                {STATUS_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(order.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

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

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Shipping Details
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-800">
                    {shippingAddress.fullName}
                  </p>
                  <p>{shippingAddress.phone}</p>
                  <p>
                    {shippingAddress.addressLine1 || shippingAddress.address}
                  </p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.state} -{" "}
                    {shippingAddress.pincode}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Ordered Items
              </h2>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={item.product || idx}
                    className="flex items-center gap-4 py-2"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex flex-wrap justify-center gap-4 bg-gray-50">
              <Link
                to="/orders"
                className="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold transition"
              >
                View My Orders
              </Link>
              <Link
                to="/products"
                className="border border-gray-300 text-gray-700 hover:bg-white px-6 py-2.5 rounded-lg font-semibold transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default OrderConfirmation;

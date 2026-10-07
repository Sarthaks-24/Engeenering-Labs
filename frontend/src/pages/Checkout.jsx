import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartContext from "../context/CartContext";
import Navbar from "../components/Navbar";
import api from "../services/api";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const navigate = useNavigate();
  const {
    cartItems = [],
    loading = false,
    getCart,
    clearCart,
  } = useContext(CartContext) || {};

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    if (getCart) {
      getCart();
    }
  }, [getCart]);

  const totalAmount = cartItems.reduce(
    (total, item) =>
      total +
      Number(item?.product?.price ?? item?.price ?? 0) *
        Number(item?.quantity ?? 1),
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    }

    let cleanPhone = "";
    for (let i = 0; i < formData.phone.length; i++) {
      const char = formData.phone[i];
      if (char !== " " && char !== "-") {
        cleanPhone += char;
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required.";
    } else if (
      cleanPhone.length !== 10 ||
      !cleanPhone.split("").every((ch) => ch >= "0" && ch <= "9")
    ) {
      newErrors.phone = "Phone must contain a valid 10-digit number.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    const trimmedPincode = formData.pincode.trim();
    if (
      trimmedPincode.length !== 6 ||
      !trimmedPincode.split("").every((ch) => ch >= "0" && ch <= "9")
    ) {
      newErrors.pincode = "Pincode must contain 6 digits.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cartItems || cartItems.length === 0) {
      setSubmitError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitError("");

    let cleanPhone = "";
    for (let i = 0; i < formData.phone.length; i++) {
      const char = formData.phone[i];
      if (char !== " " && char !== "-") {
        cleanPhone += char;
      }
    }

    const payload = {
      shippingAddress: {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        address: formData.address.trim(),
        addressLine1: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
    };

    try {
      const response = await api.post("/orders/create-payment-order", payload);
      const data = response.data;

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setSubmitError(
          "Unable to load Razorpay payment SDK. Please verify your connection."
        );
        setIsSubmitting(false);
        return;
      }

      // Step 10: Open Razorpay Checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,

        handler: async function (paymentResponse) {
          try {
            setIsSubmitting(true);
            setSubmitError("");

            // Step 11: Call Payment Verification API
            const verifyRes = await api.post("/orders/verify-payment", {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              if (clearCart) clearCart();
              if (getCart) getCart();
              const finalOrder = verifyRes.data.order || data.order;
              setConfirmedOrder(finalOrder);
              setOrderPlaced(true);
              if (finalOrder?._id) {
                navigate(`/order-success/${finalOrder._id}`);
              }
            } else {
              setSubmitError(
                verifyRes.data?.message || "Payment verification failed."
              );
            }
          } catch (verifyErr) {
            const errMessage =
              verifyErr.response?.data?.message ||
              verifyErr.response?.data?.error ||
              "Payment verification failed.";
            setSubmitError(errMessage);
          } finally {
            setIsSubmitting(false);
          }
        },

        prefill: {
          name: formData.fullName.trim(),
          contact: cleanPhone,
        },

        theme: {
          color: "#111827",
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (failResponse) {
        console.error("Payment failed", failResponse.error);
        setSubmitError(
          failResponse.error?.description ||
            "Payment failed. Please try again."
        );
        setIsSubmitting(false);
      });

      paymentObject.open();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to initiate order.";
      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Card Container */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Checkout
              </h1>
            </div>

            {orderPlaced ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Placed Successfully
                </h2>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left max-w-md mx-auto space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Order ID:</span>{" "}
                    {confirmedOrder?._id || "Order confirmed"}
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span>{" "}
                    {formatPrice(confirmedOrder?.totalAmount || totalAmount)}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span className="text-green-600 font-bold">
                      {confirmedOrder?.status || "PLACED"}
                    </span>
                  </p>
                </div>
                <p className="text-gray-600 mt-4">
                  Your order has been verified and saved successfully.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/products"
                    className="bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Global / Form-level error display */}
                {Object.keys(errors).length > 0 && (
                  <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    <p className="font-semibold text-sm">
                      Please correct the following errors:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-sm space-y-0.5">
                      {Object.values(errors).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {submitError && (
                  <div className="m-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    {submitError}
                  </div>
                )}

                {/* Shipping Details Section */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Shipping Details
                  </h2>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="fullName"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Full Name"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.fullName
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.fullName && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">
                            {errors.fullName}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="phone"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.phone
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">{errors.phone}</p>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="address"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Address"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.address
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.address && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">
                            {errors.address}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="city"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.city
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.city && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">{errors.city}</p>
                        </div>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="state"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          State
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="State"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.state
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.state && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">{errors.state}</p>
                        </div>
                      )}
                    </div>

                    {/* Pincode */}
                    <div>
                      <div className="sm:grid sm:grid-cols-[140px_1fr] sm:items-center gap-4">
                        <label
                          htmlFor="pincode"
                          className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-0"
                        >
                          Pincode
                        </label>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="Pincode"
                          className={`w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition ${
                            errors.pincode
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.pincode && (
                        <div className="sm:grid sm:grid-cols-[140px_1fr] gap-4 mt-1">
                          <div className="hidden sm:block"></div>
                          <p className="text-sm text-red-600">
                            {errors.pincode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary Section */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-3">
                    {cartItems.length === 0 ? (
                      <p className="text-gray-500 italic py-2">
                        No items in cart.
                      </p>
                    ) : (
                      cartItems.map((item) => {
                        const product = item?.product || {};
                        const name = product.name || item?.name || "Product";
                        const price = Number(product.price ?? item?.price ?? 0);
                        const quantity = Number(item?.quantity ?? 1);
                        const itemTotal = price * quantity;

                        return (
                          <div
                            key={product._id || item?._id || name}
                            className="flex justify-between items-center text-gray-800 text-base py-1"
                          >
                            <span>
                              {name} × {quantity}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(itemTotal)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-gray-200 mt-6 pt-4 flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>

                  {/* Place Order Button */}
                  <div className="mt-8 flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-full sm:w-auto sm:px-12 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-colors shadow disabled:opacity-50 cursor-pointer text-center"
                    >
                      {isSubmitting ? "Processing..." : "Place Order"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default Checkout;

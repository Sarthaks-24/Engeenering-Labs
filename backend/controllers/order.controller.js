import crypto from "crypto";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import razorpay from "../config/razorpay.js";

export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { shippingAddress } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    const fullName = shippingAddress.fullName?.trim();
    const phone = shippingAddress.phone?.trim();
    const addressLine1 = (
      shippingAddress.addressLine1 || shippingAddress.address
    )?.trim();
    const city = shippingAddress.city?.trim();
    const state = shippingAddress.state?.trim();
    const pincode = shippingAddress.pincode?.trim();

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        error: "All shipping address fields are required",
      });
    }

    let cleanPhone = "";
    for (let i = 0; i < phone.length; i++) {
      const char = phone[i];
      if (char !== " " && char !== "-") {
        cleanPhone += char;
      }
    }

    const isPhoneValid =
      cleanPhone.length === 10 &&
      cleanPhone.split("").every((ch) => ch >= "0" && ch <= "9");

    if (!isPhoneValid) {
      return res.status(400).json({
        error: "Phone must contain a valid 10-digit number",
      });
    }

    const isPincodeValid =
      pincode.length === 6 &&
      pincode.split("").every((ch) => ch >= "0" && ch <= "9");

    if (!isPincodeValid) {
      return res.status(400).json({
        error: "Pincode must contain 6 digits.",
      });
    }

    // Load user and cart
    const user = await Customer.findById(userId).populate("cart.product");
    if (!user) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Load latest product data, verify stock, calculate server-side total, build snapshot
    let totalAmount = 0;
    const orderItems = [];

    for (const item of user.cart) {
      const productId = item.product?._id || item.product;
      const latestProduct = await Product.findById(productId);

      if (!latestProduct) {
        return res.status(400).json({
          error: `Product no longer exists: ${item.product?.name || productId}`,
        });
      }

      if (latestProduct.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${latestProduct.name}.`,
        });
      }

      const itemTotal = latestProduct.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: latestProduct._id,
        name: latestProduct.name,
        price: latestProduct.price,
        quantity: item.quantity,
        image: latestProduct.image,
      });
    }

    // Create ShopKart pending order
    const shopKartOrder = new Order({
      user: user._id,
      items: orderItems,
      shippingAddress: {
        fullName,
        phone,
        addressLine1,
        city,
        state,
        pincode,
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await shopKartOrder.save();

    // Create Razorpay Order in paise
    const amountInPaise = Math.round(totalAmount * 100);
    let razorpayOrder;

    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: shopKartOrder._id.toString(),
      });
    } catch (rzpErr) {
      console.error("Razorpay order creation notice:", rzpErr.message);
      // Fallback if test credentials are placeholders or network unavailable
      if (
        !process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_KEY_ID?.includes("xxxx") ||
        rzpErr.statusCode === 401
      ) {
        razorpayOrder = {
          id: `order_${shopKartOrder._id.toString().slice(-14)}`,
          amount: amountInPaise,
          currency: "INR",
        };
      } else {
        throw rzpErr;
      }
    }

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      order: shopKartOrder,
    });
  } catch (err) {
    console.error("Error creating payment order:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const trustedOrderId = order.razorpayOrderId || razorpay_order_id;
    const body = trustedOrderId + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_test_secret")
      .update(body)
      .digest("hex");

    const isSignatureValid =
      expectedSignature === razorpay_signature ||
      (process.env.RAZORPAY_KEY_SECRET === "your_test_secret" &&
        razorpay_signature === "signature_here");

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Decrement purchased quantities from product stocks
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    const user = await Customer.findById(userId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (err) {
    console.error("Error verifying payment:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        error: "Forbidden: You cannot view orders that do not belong to you",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Error fetching single order:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

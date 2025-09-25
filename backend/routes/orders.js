const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { auth } = require("../middleware/auth");
const { validateRequest, checkoutSchema } = require("../middleware/validation");
const { simulatePayment, validatePaymentData, generatePaymentReceipt } = require("../utils/payment");

const router = express.Router();

// @route   POST /api/orders/checkout
// @desc    Create order and process payment
// @access  Private
router.post("/checkout", auth, validateRequest(checkoutSchema), async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate all items are still available
    for (const item of cart.items) {
      if (!item.product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.product.name}" is no longer available`,
        });
      }

      if (!item.product.isInStock(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}"`,
        });
      }
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
      })),
      shippingAddress,
      paymentMethod,
      notes,
      subtotal: cart.totalPrice,
      shippingCost: cart.totalPrice > 50 ? 0 : 10, // Free shipping over $50
    });

    // Calculate totals
    order.calculateTotals();
    await order.save();

    // Prepare payment data
    const paymentData = {
      amount: order.total,
      currency: "USD",
      paymentMethod,
      orderId: order._id,
    };

    // Validate payment data
    validatePaymentData(paymentData);

    // Simulate payment processing
    const paymentResult = await simulatePayment(paymentData);

    // Update order with payment result
    if (paymentResult.success) {
      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";

      // Reduce stock for all items
      for (const item of cart.items) {
        await item.product.reduceStock(item.quantity);
      }

      // Clear cart
      await cart.clearCart();
    } else {
      order.paymentStatus = "failed";
    }

    await order.save();

    // Generate receipt if payment successful
    let receipt = null;
    if (paymentResult.success) {
      receipt = generatePaymentReceipt(paymentResult, order);
    }

    res.status(paymentResult.success ? 201 : 400).json({
      success: paymentResult.success,
      message: paymentResult.success ? "Order created and payment processed successfully" : "Payment failed",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          paymentStatus: order.paymentStatus,
          total: order.total,
          items: order.items,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
        payment: paymentResult,
        receipt,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during checkout",
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
        },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images description")
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.updateStatus(status);

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    if (error.message.includes("Invalid status transition")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics (Admin only)
// @access  Private (Admin)
router.get("/stats/summary", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentStats = await Order.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
        statusBreakdown: statusStats,
        paymentBreakdown: paymentStats,
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

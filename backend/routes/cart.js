const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { auth } = require("../middleware/auth");
const { validateRequest, addToCartSchema, updateCartItemSchema, bulkCartUpdateSchema } = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    let cart = await Cart.findByUser(req.user._id);

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post("/add", auth, validateRequest(addToCartSchema), async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    if (!product.isInStock(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Add item to cart
    await cart.addItem(productId, quantity);

    // Populate cart with product details
    await cart.populate("items.product");

    res.json({
      success: true,
      message: "Item added to cart successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    if (error.message === "Insufficient stock") {
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

// @route   PATCH /api/cart/update/:productId
// @desc    Update cart item quantity
// @access  Private
router.patch("/update/:productId", auth, validateRequest(updateCartItemSchema), async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);

    // Populate cart with product details
    await cart.populate("items.product");

    res.json({
      success: true,
      message: "Cart updated successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Update cart error:", error);
    if (error.message === "Insufficient stock" || error.message === "Product not found") {
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

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Remove item from cart
    await cart.removeItem(productId);

    // Populate cart with product details
    await cart.populate("items.product");

    res.json({
      success: true,
      message: "Item removed from cart successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete("/clear", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Clear cart
    await cart.clearCart();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: { cart },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart item count
// @access  Private
router.get("/count", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const itemCount = cart ? cart.totalItems : 0;

    res.json({
      success: true,
      data: { itemCount },
    });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

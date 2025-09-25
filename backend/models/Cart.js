const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
      min: [0, "Total items cannot be negative"],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
// cartSchema.index({ user: 1 }); // Removed - already defined as unique: true

// Pre-save middleware to calculate totals
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = async function (productId, quantity = 1) {
  const Product = mongoose.model("Product");
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.isInStock(quantity)) {
    throw new Error("Insufficient stock");
  }

  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    // Check if adding more quantity exceeds stock
    if (!product.isInStock(existingItem.quantity + quantity)) {
      throw new Error("Insufficient stock");
    }
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const Product = mongoose.model("Product");
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  if (quantity <= 0) {
    return this.removeItem(productId);
  }

  if (!product.isInStock(quantity)) {
    throw new Error("Insufficient stock");
  }

  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (item) {
    item.quantity = quantity;
    item.price = product.price; // Update price in case it changed
  } else {
    throw new Error("Item not found in cart");
  }

  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Instance method to check if cart is empty
cartSchema.methods.isEmpty = function () {
  return this.items.length === 0;
};

// Static method to find cart by user
cartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate("items.product");
};

module.exports = mongoose.model("Cart", cartSchema);

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: false, // Will be set by pre-save middleware
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "US",
      },
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "stripe"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, "Shipping cost cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    trackingNumber: {
      type: String,
      sparse: true,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// orderSchema.index({ orderNumber: 1 }); // Removed - already defined as unique: true
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for formatted order number
orderSchema.virtual("formattedOrderNumber").get(function () {
  return `#${this.orderNumber}`;
});

// Virtual for order status display
orderSchema.virtual("statusDisplay").get(function () {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return statusMap[this.orderStatus] || this.orderStatus;
});

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

// Instance method to update order status
orderSchema.methods.updateStatus = function (newStatus) {
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[this.orderStatus].includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${this.orderStatus} to ${newStatus}`
    );
  }

  this.orderStatus = newStatus;

  if (newStatus === "shipped") {
    this.shippedAt = new Date();
  } else if (newStatus === "delivered") {
    this.deliveredAt = new Date();
  }

  return this.save();
};

// Instance method to update payment status
orderSchema.methods.updatePaymentStatus = function (newStatus) {
  this.paymentStatus = newStatus;
  return this.save();
};

// Instance method to calculate totals
orderSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  this.tax = this.subtotal * 0.08; // 8% tax
  this.total = this.subtotal + this.shippingCost + this.tax;
  return this;
};

// Static method to find orders by user
orderSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status) {
  return this.find({ orderStatus: status }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Order", orderSchema);

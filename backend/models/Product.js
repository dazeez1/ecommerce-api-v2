const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      enum: [
        "electronics",
        "clothing",
        "books",
        "home",
        "sports",
        "beauty",
        "toys",
        "automotive",
        "other",
      ],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "Brand name cannot exceed 50 characters"],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "Product image",
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    tags: [String],
    specifications: {
      type: Map,
      of: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });

// Virtual for availability
productSchema.virtual("isAvailable").get(function () {
  return this.stock > 0 && this.isActive;
});

// Virtual for formatted price
productSchema.virtual("formattedPrice").get(function () {
  return this.price ? `$${this.price.toFixed(2)}` : "$0.00";
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre("save", function (next) {
  if (!this.sku) {
    this.sku = `SKU-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }
  next();
});

// Instance method to check if product is in stock
productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity && this.isActive;
};

// Instance method to reduce stock
productSchema.methods.reduceStock = function (quantity) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    return this.save();
  }
  throw new Error("Insufficient stock");
};

// Instance method to increase stock
productSchema.methods.increaseStock = function (quantity) {
  this.stock += quantity;
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true });
};

// Static method to search products
productSchema.statics.searchProducts = function (query) {
  return this.find({
    $text: { $search: query },
    isActive: true,
  });
};

module.exports = mongoose.model("Product", productSchema);

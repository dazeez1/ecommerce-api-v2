const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }
    next();
  };
};

// User validation schemas
const userRegistrationSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name cannot exceed 50 characters",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name cannot exceed 50 characters",
    "any.required": "Last name is required",
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    "string.pattern.base": "Please provide a valid phone number",
  }),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Product name must be at least 2 characters",
    "string.max": "Product name cannot exceed 100 characters",
    "any.required": "Product name is required",
  }),
  description: Joi.string().trim().min(10).max(1000).required().messages({
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description cannot exceed 1000 characters",
    "any.required": "Product description is required",
  }),
  price: Joi.number().min(0).required().messages({
    "number.min": "Price cannot be negative",
    "any.required": "Product price is required",
  }),
  category: Joi.string()
    .valid(
      "electronics",
      "clothing",
      "books",
      "home",
      "sports",
      "beauty",
      "toys",
      "automotive",
      "other"
    )
    .required()
    .messages({
      "any.only": "Please select a valid category",
      "any.required": "Product category is required",
    }),
  brand: Joi.string().trim().max(50).optional().messages({
    "string.max": "Brand name cannot exceed 50 characters",
  }),
  stock: Joi.number().min(0).required().messages({
    "number.min": "Stock cannot be negative",
    "any.required": "Stock quantity is required",
  }),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().optional(),
      })
    )
    .optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
});

// Cart validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid product ID format",
    "string.length": "Product ID must be 24 characters",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().min(1).max(100).default(1).messages({
    "number.min": "Quantity must be at least 1",
    "number.max": "Quantity cannot exceed 100",
  }),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().min(1).max(100).required().messages({
    "number.min": "Quantity must be at least 1",
    "number.max": "Quantity cannot exceed 100",
    "any.required": "Quantity is required",
  }),
});

// Order validation schemas
const checkoutSchema = Joi.object({
  shippingAddress: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    street: Joi.string().trim().min(5).max(100).required(),
    city: Joi.string().trim().min(2).max(50).required(),
    state: Joi.string().trim().min(2).max(50).required(),
    zipCode: Joi.string().trim().min(5).max(10).required(),
    country: Joi.string().trim().max(50).default("US"),
  }).required(),
  paymentMethod: Joi.string()
    .valid("credit_card", "debit_card", "paypal", "stripe")
    .required()
    .messages({
      "any.only": "Please select a valid payment method",
      "any.required": "Payment method is required",
    }),
  notes: Joi.string().trim().max(500).optional(),
});

module.exports = {
  validateRequest,
  userRegistrationSchema,
  userLoginSchema,
  productSchema,
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
};

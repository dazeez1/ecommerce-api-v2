const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import database connection
const connectDB = require("./config/database");
connectDB();

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");

// Import middleware
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { sanitizeUserInput, sanitizeObjectId } = require("./middleware/sanitization");

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced rate limiting for different routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 admin requests per windowMs
  message: "Too many admin requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply rate limiting
app.use(generalLimiter);

// Logging
app.use(morgan("combined"));

// Body parsing with size limits
app.use(express.json({ 
  limit: "10mb",
  verify: (req, res, buf) => {
    // Additional security check for JSON payload
    if (buf.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Payload too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization middleware
app.use(sanitizeUserInput);
app.use(sanitizeObjectId);

// Routes with specific rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Ecommerce API v2",
    version: "2.0.0",
    status: "running",
    features: [
      "User Authentication with JWT",
      "Product CRUD Operations",
      "Shopping Cart Management",
      "Order Processing with Payment Simulation",
      "Admin Order Management",
      "Enhanced Security & Input Validation"
    ],
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      admin: "/api/admin",
    },
    documentation: "https://github.com/dazeez1/ecommerce-api-v2#readme"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Ecommerce API v2",
    version: "2.0.0",
    description: "A robust and scalable e-commerce REST API",
    endpoints: {
      authentication: {
        "POST /api/auth/signup": "Register a new user",
        "POST /api/auth/login": "Login user and get JWT token",
        "GET /api/auth/profile": "Get user profile (protected)"
      },
      products: {
        "GET /api/products": "Get all products",
        "GET /api/products/:id": "Get product by ID",
        "POST /api/products": "Create new product (admin/customer)",
        "PATCH /api/products/:id": "Update product (admin/customer)",
        "DELETE /api/products/:id": "Delete product (admin/customer)"
      },
      cart: {
        "POST /api/cart/add": "Add item to cart",
        "GET /api/cart": "Get user's cart",
        "PATCH /api/cart/update/:id": "Update cart item quantity",
        "DELETE /api/cart/remove/:id": "Remove item from cart",
        "DELETE /api/cart/clear": "Clear entire cart"
      },
      orders: {
        "POST /api/orders/checkout": "Create order and process payment",
        "GET /api/orders": "Get user's orders",
        "GET /api/orders/:id": "Get specific order details"
      },
      admin: {
        "GET /api/admin/orders": "Get all orders (admin only)",
        "GET /api/admin/orders/:id": "Get specific order (admin only)",
        "PATCH /api/admin/orders/:id/status": "Update order status (admin only)",
        "GET /api/admin/orders/statistics/overview": "Get order statistics (admin only)"
      }
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/api/admin`);
});

module.exports = app;

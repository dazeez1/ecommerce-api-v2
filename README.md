# Ecommerce API v2

A robust and scalable e-commerce REST API built with Node.js, Express, and MongoDB. This API provides comprehensive functionality for managing products, users, orders, and authentication in an e-commerce platform.

## Features

- **User Management**: User registration, authentication, and profile management with role-based access control
- **Product Catalog**: CRUD operations for products with categories, search, and filtering
- **Shopping Cart**: Complete cart management with stock validation
- **Order Management**: Complete order lifecycle from cart to fulfillment with payment simulation
- **Admin Panel**: Comprehensive admin order management and statistics
- **Authentication & Authorization**: JWT-based secure authentication with role-based access
- **Input Validation**: Comprehensive request validation and sanitization using Joi
- **Security Enhancements**: Helmet, CORS, rate limiting, and XSS protection
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **API Documentation**: Comprehensive endpoint documentation
- **Testing**: Unit and integration tests with Jest

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi for comprehensive input validation
- **Security**: Helmet, CORS, bcrypt, express-rate-limit, xss
- **Testing**: Jest, Supertest
- **Logging**: Morgan for HTTP request logging
- **Environment**: dotenv for environment variable management

## Project Structure

```
ecommerce-api-v2/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── roleCheck.js         # Role-based access control
│   │   ├── validation.js        # Joi validation schemas
│   │   ├── sanitization.js      # Input sanitization middleware
│   │   └── errorHandler.js      # Centralized error handling
│   ├── models/
│   │   ├── User.js              # User model with authentication
│   │   ├── Product.js           # Product model with SKU generation
│   │   ├── Cart.js              # Shopping cart model
│   │   └── Order.js             # Order model with status tracking
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product CRUD routes
│   │   ├── cart.js              # Cart management routes
│   │   ├── orders.js            # Order processing routes
│   │   └── admin.js             # Admin order management routes
│   ├── utils/
│   │   └── payment.js          # Payment simulation utility
│   └── server.js               # Main application entry point
├── .gitignore
├── package.json
└── README.md
```

## Installation & Usage

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dazeez1/ecommerce-api-v2.git
   cd ecommerce-api-v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Environment Variables

Create a `backend/.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_URI_TEST=mongodb://localhost:27017/ecommerce-v2-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# API Configuration
API_PREFIX=/api
API_VERSION=v1

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

## API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Authentication Endpoints

| Method | Endpoint            | Description                  | Access    |
| ------ | ------------------- | ---------------------------- | --------- |
| POST   | `/api/auth/signup`  | Register a new user          | Public    |
| POST   | `/api/auth/login`   | Login user and get JWT token | Public    |
| GET    | `/api/auth/profile` | Get user profile             | Protected |

### Example Requests & Responses

#### 1. User Registration

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "fullName": "John Doe"
    }
  }
}
```

#### 2. User Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Product Endpoints

| Method | Endpoint            | Description                     | Access                     |
| ------ | ------------------- | ------------------------------- | -------------------------- |
| GET    | `/api/products`     | Get all products with filtering | Public                     |
| GET    | `/api/products/:id` | Get product by ID               | Public                     |
| POST   | `/api/products`     | Create new product              | Protected (Admin/Customer) |
| PATCH  | `/api/products/:id` | Update product                  | Protected (Admin/Owner)    |
| DELETE | `/api/products/:id` | Delete product                  | Protected (Admin/Owner)    |

### Example Requests & Responses

#### 3. Get All Products

```bash
GET /api/products?page=1&limit=10&category=electronics&sortBy=price&sortOrder=asc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": 999.99,
        "category": "electronics",
        "brand": "Apple",
        "stock": 50,
        "images": [
          {
            "url": "https://example.com/iphone.jpg",
            "alt": "iPhone 15 Pro"
          }
        ],
        "tags": ["smartphone", "apple", "premium"],
        "isAvailable": true,
        "formattedPrice": "$999.99",
        "averageRating": 4.8,
        "reviewCount": 150
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Cart Endpoints

| Method | Endpoint               | Description               | Access    |
| ------ | ---------------------- | ------------------------- | --------- |
| GET    | `/api/cart`            | Get user's cart           | Protected |
| POST   | `/api/cart/add`        | Add item to cart          | Protected |
| PATCH  | `/api/cart/update/:id` | Update cart item quantity | Protected |
| DELETE | `/api/cart/remove/:id` | Remove item from cart     | Protected |
| DELETE | `/api/cart/clear`      | Clear entire cart         | Protected |

### Example Requests & Responses

#### 4. Add Item to Cart

```bash
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "quantity": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "user": "64f8a1b2c3d4e5f6a7b8c9d0",
      "items": [
        {
          "product": {
            "id": "64f8a1b2c3d4e5f6a7b8c9d1",
            "name": "iPhone 15 Pro",
            "price": 999.99,
            "images": ["https://example.com/iphone.jpg"]
          },
          "quantity": 2,
          "price": 999.99,
          "subtotal": 1999.98
        }
      ],
      "totalItems": 2,
      "totalPrice": 1999.98,
      "updatedAt": "2025-09-25T04:30:00.000Z"
    }
  }
}
```

## Order Endpoints

| Method | Endpoint               | Description                      | Access    |
| ------ | ---------------------- | -------------------------------- | --------- |
| POST   | `/api/orders/checkout` | Create order and process payment | Protected |
| GET    | `/api/orders`          | Get user's orders                | Protected |
| GET    | `/api/orders/:id`      | Get specific order details       | Protected |

### Example Requests & Responses

#### 5. Create Order (Checkout)

```bash
POST /api/orders/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "paymentMethod": "credit_card",
  "notes": "Please deliver after 5 PM"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created and payment processed successfully",
  "data": {
    "order": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "orderNumber": "ORD-1758774600000-0001",
      "user": "64f8a1b2c3d4e5f6a7b8c9d0",
      "items": [
        {
          "product": {
            "id": "64f8a1b2c3d4e5f6a7b8c9d1",
            "name": "iPhone 15 Pro",
            "price": 999.99
          },
          "quantity": 2,
          "price": 999.99,
          "subtotal": 1999.98
        }
      ],
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "paymentDetails": {
        "method": "credit_card",
        "status": "completed",
        "transactionId": "TXN-1758774600000"
      },
      "orderStatus": "confirmed",
      "subtotal": 1999.98,
      "shippingCost": 10.0,
      "tax": 160.0,
      "total": 2169.98,
      "createdAt": "2025-09-25T04:30:00.000Z"
    },
    "receipt": {
      "orderNumber": "ORD-1758774600000-0001",
      "total": 2169.98,
      "paymentStatus": "completed",
      "estimatedDelivery": "2025-09-27T04:30:00.000Z"
    }
  }
}
```

## Admin Endpoints

| Method | Endpoint                                | Description                    | Access     |
| ------ | --------------------------------------- | ------------------------------ | ---------- |
| GET    | `/api/admin/orders`                     | Get all orders with pagination | Admin Only |
| GET    | `/api/admin/orders/:id`                 | Get specific order details     | Admin Only |
| PATCH  | `/api/admin/orders/:id/status`          | Update order status            | Admin Only |
| GET    | `/api/admin/orders/statistics/overview` | Get order statistics           | Admin Only |
| DELETE | `/api/admin/orders/:id`                 | Cancel order (soft delete)     | Admin Only |

### Example Requests & Responses

#### 6. Update Order Status (Admin)

```bash
PATCH /api/admin/orders/64f8a1b2c3d4e5f6a7b8c9d3/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped",
  "note": "Package shipped via FedEx, tracking: 1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated to shipped",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "orderNumber": "ORD-1758774600000-0001",
    "orderStatus": "shipped",
    "statusHistory": [
      {
        "status": "pending",
        "updatedAt": "2025-09-25T04:30:00.000Z",
        "updatedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
      },
      {
        "status": "confirmed",
        "updatedAt": "2025-09-25T04:35:00.000Z",
        "updatedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
      },
      {
        "status": "shipped",
        "updatedAt": "2025-09-25T04:40:00.000Z",
        "updatedBy": "64f8a1b2c3d4e5f6a7b8c9d4",
        "note": "Package shipped via FedEx, tracking: 1234567890"
      }
    ]
  }
}
```

## Security Features

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Admin Routes**: 50 requests per 15 minutes per IP

### Input Sanitization

- XSS protection using the `xss` library
- HTML tag removal from user inputs
- MongoDB ObjectId validation
- SQL injection prevention

### Security Headers

- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 0
- Helmet.js for comprehensive security

### Validation

- Comprehensive Joi validation schemas
- Input length and format validation
- Email format validation
- Password strength requirements
- Product data validation

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 API Status & Health

### Health Check

```bash
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-09-25T04:30:00.000Z",
  "uptime": 3600.123,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1024000
  },
  "environment": "development"
}
```

### API Information

```bash
GET /api
```

Returns comprehensive API documentation with all available endpoints and their descriptions.

## Deployment

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/production-db
JWT_SECRET=your-super-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ecommerce-api-v2 .

# Run container
docker run -p 3000:3000 --env-file .env ecommerce-api-v2
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Azeez Damilare Gbenga**

- GitHub: [@dazeez1](https://github.com/dazeez1)

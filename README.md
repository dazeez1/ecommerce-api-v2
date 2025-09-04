# Ecommerce API v2

A robust and scalable e-commerce REST API built with Node.js, Express, and MongoDB. This API provides comprehensive functionality for managing products, users, orders, and authentication in an e-commerce platform.

## Features

- **User Management**: User registration, authentication, and profile management
- **Product Catalog**: CRUD operations for products with categories and search
- **Order Management**: Complete order lifecycle from cart to fulfillment
- **Authentication & Authorization**: JWT-based secure authentication
- **Input Validation**: Comprehensive request validation and sanitization
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Testing**: Unit and integration tests with Jest

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi, express-validator
- **Security**: Helmet, CORS, bcrypt
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **Logging**: Morgan, Winston
- **Environment**: dotenv

## 📁 Project Structure

```
ecommerce-api-v2/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── server.js       # Main entry point
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Installation & Usage

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ecommerce-api-v2.git
   cd ecommerce-api-v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   node server.js
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce-v2
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:3000/api-docs`
- API Docs: `http://localhost:3000/docs`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Azeez Drey**

- GitHub: [@dazeez1](https://github.com/dazeez1)

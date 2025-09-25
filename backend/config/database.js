const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(
      `🌐 Connection State: ${
        conn.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error.message);
    console.log("🔄 Running in offline mode - some features may be limited");
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("📦 MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("📦 MongoDB connection closed through app termination");
  process.exit(0);
});

module.exports = connectDB;

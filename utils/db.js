const mongoose = require("mongoose");

let isConnected = false; // Global connection state

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ Using existing MongoDB connection");
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("❌ MONGO_URI is not set in environment variables");
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    const db = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false, // important for serverless
      maxPoolSize: 10, // small pool for Vercel's short-lived runtime
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected:", db.connection.host);
    return db.connection;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = connectDB;

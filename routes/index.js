// index.js
const express = require("express");
const connectDB = require("./utils/db"); // if you created this earlier
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

// Connect to MongoDB (safe cached connection)
connectDB();

// Mount all routes
app.use("/api/auth", authRoutes);

// Optional test route
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// Fallback route (helps debug 404s)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

module.exports = app;

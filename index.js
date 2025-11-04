// Hifz-Tracker-Backend/index.js

const express = require("express");
const connectDB = require("../utils/db");
const authRoutes = require("../routes/auth");
const adminRoutes = require("../routes/admin");
const attendanceRoutes = require("../routes/attendance");
const classesRoutes = require("../routes/classes");
const homeworkRoutes = require("../routes/homework");
const activityRoutes = require("../routes/activity");

const app = express();
app.use(express.json());

// ✅ Ensure MongoDB connects before routes mount
(async () => {
  try {
    await connectDB();
    console.log("✅ Database connection ready");

    // Mount all route files
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/classes", classesRoutes);
    app.use("/api/homework", homeworkRoutes);
    app.use("/api/activity", activityRoutes);

    // Root test route
    app.get("/", (req, res) => {
      res.json({ success: true, message: "Hifz Tracker API running" });
    });

    // 404 fallback
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
      });
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
  }
})();

module.exports = app;

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// =========================
// REGISTER NEW USER
// =========================
router.post("/register", async (req, res) => {
  try {
    const { name, phoneNumber, email, password, masjidInfo } = req.body;

    const user = new User({
      name,
      phoneNumber,
      email,
      password,
      masjidInfo,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          masjidInfo: user.masjidInfo,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// =========================
// LOGIN USER
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: "Account is deactivated" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          masjidInfo: user.masjidInfo,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// =========================
// STUDENT LOGIN
// =========================
router.post("/student-login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log("Student login attempt:", { studentId, hasPassword: !!password });

    const student = await User.findOne({
      phoneNumber: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    if (password) {
      if (!student.password) {
        return res.status(400).json({ success: false, message: "No password set for this student" });
      }

      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid password" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    if (!student.isActive) {
      return res.status(400).json({ success: false, message: "Student account is deactivated" });
    }

    const token = jwt.sign({ id: student._id, role: "student" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Student login successful",
      data: {
        student: {
          id: student._id,
          studentId: student.phoneNumber,
          name: student.name,
          class: student.studentInfo?.class,
          section: student.studentInfo?.section,
          teacherId: student.teacherId,
          role: student.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({
      success: false,
      message: "Student login failed",
      error: error.message,
    });
  }
});

// =========================
// ADMIN LOGIN
// =========================
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await User.findOne({ email: username, role: "admin" });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });
    }

    if (!admin.isActive) {
      return res.status(400).json({ success: false, message: "Admin account is deactivated" });
    }

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phoneNumber: admin.phoneNumber,
          role: admin.role,
          masjidInfo: admin.masjidInfo,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message,
    });
  }
});

// =========================
// GET CURRENT USER
// =========================
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
});

module.exports = router;

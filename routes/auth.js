const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, phoneNumber, email, password, masjidInfo } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone number already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      phoneNumber,
      email,
      password,
      masjidInfo
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          masjidInfo: user.masjidInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          masjidInfo: user.masjidInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Student login
router.post('/student-login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log('Student login attempt:', { studentId, hasPassword: !!password });

    // Find student by studentId (stored in phoneNumber field for now)
    const student = await User.findOne({ 
      phoneNumber: studentId,
      role: 'student'
    });
    
    if (!student) {
      console.log('Student not found with ID:', studentId);
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    console.log('Student found:', { 
      id: student._id, 
      name: student.name, 
      phoneNumber: student.phoneNumber,
      hasPassword: !!student.password,
      isActive: student.isActive 
    });

    // Check if password is provided and matches
    if (password) {
      if (!student.password) {
        console.log('Student has no password set');
        return res.status(400).json({
          success: false,
          message: 'No password set for this student'
        });
      }
      
      const isMatch = await student.comparePassword(password);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }
    } else {
      console.log('No password provided');
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Student account is deactivated'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Student login successful for:', student.name);

    res.json({
      success: true,
      message: 'Student login successful',
      data: {
        student: {
          id: student._id,
          studentId: student.phoneNumber,
          name: student.name,
          class: student.studentInfo?.class,
          section: student.studentInfo?.section,
          teacherId: student.teacherId,
          role: student.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Student login failed',
      error: error.message
    });
  }
});

// Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin user by username (email field)
    const admin = await User.findOne({ 
      email: username,
      role: 'admin'
    });
    
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phoneNumber: admin.phoneNumber,
          role: admin.role,
          masjidInfo: admin.masjidInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
});

module.exports = router;

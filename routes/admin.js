const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

// ===========================
// ✅ Admin Login Route (Added)
// ===========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate token
    const token = await admin.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// ===========================
// Update admin credentials
// ===========================
router.put('/update-credentials', auth, verifyAdmin, async (req, res) => {
  try {
    const { oldUsername, oldPassword, newUsername, newPassword } = req.body;

    const admin = await User.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    if (admin.email !== oldUsername) {
      return res.status(400).json({
        success: false,
        message: 'Invalid old username'
      });
    }

    const isOldPasswordValid = await admin.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid old password'
      });
    }

    const existingUser = await User.findOne({
      email: newUsername,
      _id: { $ne: admin._id }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    admin.email = newUsername;
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin credentials updated successfully'
    });
  } catch (error) {
    console.error('Update admin credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin credentials',
      error: error.message
    });
  }
});

// ===========================
// Get admin dashboard stats
// ===========================
router.get('/dashboard-stats', auth, verifyAdmin, async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalClasses = 8;

    res.json({
      success: true,
      data: { totalTeachers, totalStudents, totalClasses }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

// ===========================
// Add new teacher
// ===========================
router.post('/add-teacher', auth, verifyAdmin, async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone number already exists'
      });
    }

    const teacher = new User({
      name,
      email,
      phoneNumber,
      password: password || 'default123',
      role: 'teacher',
      isActive: true
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      message: 'Teacher added successfully',
      data: {
        user: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          phoneNumber: teacher.phoneNumber,
          role: teacher.role
        }
      }
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add teacher',
      error: error.message
    });
  }
});

// ===========================
// Add new student
// ===========================
router.post('/add-student', auth, verifyAdmin, async (req, res) => {
  try {
    const { name, phoneNumber, password, studentInfo } = req.body;

    console.log('Creating student with data:', {
      name,
      phoneNumber,
      hasPassword: !!password,
      studentInfo
    });

    // Generate a unique phone number for students (not required for students)
    const generateUniquePhoneNumber = async () => {
      let phoneNumber;
      let isUnique = false;
      
      while (!isUnique) {
        // Generate a random 10-digit number starting with 1
        phoneNumber = '1' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        const existing = await User.findOne({ phoneNumber });
        isUnique = !existing;
      }
      
      return phoneNumber;
    };

    const studentPhoneNumber = await generateUniquePhoneNumber();

    const student = new User({
      name,
      phoneNumber: studentPhoneNumber,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.hifztracker.com`,
      password: password || 'student123',
      role: 'student',
      studentInfo: studentInfo || {},
      isActive: true
    });

    await student.save();

    const assignedTeacherId = studentInfo?.teacherId || null;
    const studentDoc = new Student({
      name,
      urduName: studentInfo?.urduName || name,
      class: studentInfo?.class,
      section: studentInfo?.section,
      studentId: phoneNumber, // Use the provided student ID from frontend
      teacherId: assignedTeacherId,
      createdBy: assignedTeacherId || req.user._id
    });

    await studentDoc.save();

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: {
        user: {
          id: student._id,
          name: student.name,
          phoneNumber: student.phoneNumber,
          role: student.role,
          studentInfo: student.studentInfo
        },
        student: {
          id: studentDoc._id,
          name: studentDoc.name,
          class: studentDoc.class,
          section: studentDoc.section,
          studentId: studentDoc.studentId,
          teacherId: studentDoc.teacherId
        }
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student',
      error: error.message
    });
  }
});

// ===========================
// Get all users
// ===========================
router.get('/users', auth, verifyAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    let query = { isActive: true };
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// ===========================
// Delete user
// ===========================
router.delete('/users/:id', auth, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get students by class and section
router.get('/students/:className/:section', async (req, res) => {
  try {
    const { className, section } = req.params;
    
    const students = await Student.find({
      class: className,
      section: section,
      isActive: true,
    })
      .select('name urduName studentId class section')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = students.map(s => ({
      name: s.name,
      urduName: s.urduName,
      studentId: s.studentId,
    }));

    res.json({
      success: true,
      data: {
        students: mapped
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: error.message
    });
  }
});

module.exports = router;

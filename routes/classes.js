const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ClassModel = require('../models/Class');

// Admin-only guard
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Create new class
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, sections } = req.body || {};
    const adminId = req.user._id;

    if (!name || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ success: false, message: 'Class name and at least one section required' });
    }

    const existing = await ClassModel.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Class already exists' });
    }

    const newClass = await ClassModel.create({ name, sections, createdBy: adminId });

    // Broadcast real-time event (optional)
    try {
      const io = req.app.get('io');
      if (io) io.emit('new_class', newClass);
    } catch (_) {}

    res.status(201).json({ success: true, message: 'Class created successfully', data: newClass });
  } catch (error) {
    console.error('❌ Error creating class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all classes
router.get('/', auth, adminOnly, async (_req, res) => {
  try {
    const classes = await ClassModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a class
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ClassModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting class:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

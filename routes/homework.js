const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Placeholder for homework routes
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        homework: []
      }
    });
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get homework',
      error: error.message
    });
  }
});

// Get latest assignment(s) for a student (supports status filter and returns assignments array)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query;
    const student = await Student.findOne({ studentId }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const assignment = student.latestAssignment || null;
    const assignments = assignment ? [assignment] : [];

    const filteredAssignments = status
      ? assignments.filter(a => (a?.status || '').toLowerCase() === String(status).toLowerCase())
      : assignments;

    return res.json({ success: true, data: { assignments: filteredAssignments } });
  } catch (error) {
    console.error('Get student homework error:', error);
    res.status(500).json({ success: false, message: 'Failed to get student homework', error: error.message });
  }
});

// New route: for Student Dashboard (v2 compatibility)
router.get('/student-assignments', async (req, res) => {
  try {
    const { studentId, status } = req.query;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const student = await Student.findOne({ studentId }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const assignment = student.latestAssignment || null;
    const assignments = assignment ? [assignment] : [];

    const filteredAssignments = status
      ? assignments.filter(a => (a?.status || '').toLowerCase() === String(status).toLowerCase())
      : assignments;

    return res.json({ success: true, data: { assignments: filteredAssignments } });
  } catch (error) {
    console.error('Get student-assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get student assignments', error: error.message });
  }
});

// Assign homework/lesson to a student and emit a real-time event
router.post('/', auth, async (req, res) => {
  try {
    const {
      studentId,
      teacherId,
      title,
      description,
      dueDate,
      selectedActivityType,
      selectedSurah,
      startVerse,
      endVerse,
      startSurah,
      endSurah,
      type,
    } = req.body || {};

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required'
      });
    }

    // Normalize fields to match Student Dashboard expectations while staying backward compatible
    const effectiveType = (selectedActivityType || type || 'lesson');

    // Determine surah name from various possible payload shapes
    const surahNameFromSelected = selectedSurah ? `Surah ${selectedSurah}` : undefined;
    const surahNameFromObjects = (startSurah && (startSurah.name || (startSurah.number && `Surah ${startSurah.number}`))) ||
      (endSurah && (endSurah.name || (endSurah.number && `Surah ${endSurah.number}`)));
    const effectiveSurahName = surahNameFromSelected || surahNameFromObjects || title || 'Assignment';

    const computedTitle = title || (startSurah?.name
      ? `Surah ${startSurah.name} (${startVerse}-${endVerse})`
      : effectiveSurahName);

    const assignment = {
      studentId,
      teacherId: teacherId || (req.user?._id || null),
      title: computedTitle,
      startSurah: startSurah || (selectedSurah ? { name: `Surah ${selectedSurah}` } : { name: effectiveSurahName }),
      endSurah: endSurah || (selectedSurah ? { name: `Surah ${selectedSurah}` } : { name: effectiveSurahName }),
      startVerse: startVerse ?? null,
      endVerse: endVerse ?? null,
      type: effectiveType,
      description: description || '',
      dueDate: dueDate || null,
      status: 'assigned',
      createdAt: new Date().toISOString(),
    };

    const student = await Student.findOneAndUpdate(
      { studentId },
      { $set: { latestAssignment: assignment } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`student-${studentId}`).emit('new_task', assignment);
        console.log(`📢 Emitted 'new_task' to room student-${studentId}`);
      }
    } catch (emitErr) {
      console.warn('⚠️ Socket emit failed for new_task:', emitErr?.message || emitErr);
    }

    res.status(201).json({
      success: true,
      data: { homework: assignment }
    });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create homework',
      error: error.message
    });
  }
});

module.exports = router;

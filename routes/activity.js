const express = require('express');
const router = express.Router();

// Placeholder for activity routes
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        activities: []
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activities',
      error: error.message
    });
  }
});

module.exports = router;

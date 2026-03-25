const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   GET /api/rewards/leaderboard
// @desc    Get points leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('name points entityType')
      .sort({ points: -1 })
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rewards/my-points
// @desc    Get current user points
// @access  Private
router.get('/my-points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('points name');
    res.json({ points: user.points, name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const CollectionRequest = require('../models/CollectionRequest');
const Statistics = require('../models/Statistics');
const { auth } = require('../middleware/auth');

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload profile picture
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findById(req.user._id);
    user.profilePicture = imageUrl;
    await user.save();
    res.json({ profilePicture: imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
});

// @route   GET /api/users/collectors
// @desc    Get all collectors
// @access  Public
router.get('/collectors', async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector' })
      .select('name email phone location address');
    res.json(collectors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const totalRequests = await CollectionRequest.countDocuments({ userId: req.user._id });
    const completedRequests = await CollectionRequest.countDocuments({
      userId: req.user._id,
      status: 'completed'
    });
    const totalGlass = await CollectionRequest.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$glassQuantity' } } }
    ]);

    res.json({
      points: req.user.points,
      totalRequests,
      completedRequests,
      totalGlassCollected: totalGlass[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/environmental-stats
// @desc    Get public environmental statistics
// @access  Public (authenticated users)
router.get('/environmental-stats', auth, async (req, res) => {
  try {
    const stats = await Statistics.getStatistics();
    const totalCollectors = await User.countDocuments({ role: 'collector' });
    const totalUsers = await User.countDocuments();
    
    res.json({
      totalGlassCollected: stats.totalGlassCollected,
      co2Saved: stats.co2Saved,
      totalRequests: stats.totalRequests,
      completedRequests: stats.completedRequests,
      activeCollectors: totalCollectors,
      activeUsers: totalUsers,
      lastUpdated: stats.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

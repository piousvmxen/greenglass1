const express = require('express');
const router = express.Router();
const User = require('../models/User');
const CollectionRequest = require('../models/CollectionRequest');
const Statistics = require('../models/Statistics');
const { adminAuth } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Statistics.getStatistics();
    
    // Sync statistics with actual data
    const totalUsers = await User.countDocuments();
    const totalCollectors = await User.countDocuments({ role: 'collector' });
    const totalRequests = await CollectionRequest.countDocuments();
    const completedRequests = await CollectionRequest.countDocuments({ status: 'completed' });
    const pendingRequests = await CollectionRequest.countDocuments({ status: 'pending' });
    const activeRequests = await CollectionRequest.countDocuments({
      status: { $in: ['accepted', 'in-progress'] }
    });

    // Calculate actual glass collected from completed requests
    const completedRequestsData = await CollectionRequest.find({ status: 'completed' });
    const actualGlassCollected = completedRequestsData.reduce((sum, req) => sum + (req.glassQuantity || 0), 0);
    const actualCo2Saved = actualGlassCollected * 0.3;

    // Update statistics if there's a discrepancy
    let needsUpdate = false;
    if (stats.totalRequests !== totalRequests) {
      stats.totalRequests = totalRequests;
      needsUpdate = true;
    }
    if (stats.completedRequests !== completedRequests) {
      stats.completedRequests = completedRequests;
      needsUpdate = true;
    }
    if (Math.abs(stats.totalGlassCollected - actualGlassCollected) > 0.1) {
      stats.totalGlassCollected = actualGlassCollected;
      needsUpdate = true;
    }
    if (Math.abs(stats.co2Saved - actualCo2Saved) > 0.1) {
      stats.co2Saved = actualCo2Saved;
      needsUpdate = true;
    }
    if (needsUpdate) {
      stats.lastUpdated = new Date();
      await stats.save();
    }

    const recentRequests = await CollectionRequest.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      ...stats.toObject(),
      totalUsers,
      totalCollectors,
      pendingRequests,
      activeRequests,
      recentRequests
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin)
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/premium
// @desc    Toggle premium status
// @access  Private (Admin)
router.put('/users/:id/premium', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isPremium = !user.isPremium;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all requests (admin view)
// @access  Private (Admin)
router.get('/requests', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const requests = await CollectionRequest.find(query)
      .populate('userId', 'name email phone entityType')
      .populate('collectorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/requests/:id
// @desc    Update a request (admin only)
// @access  Private (Admin)
router.put('/requests/:id', adminAuth, async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const oldStatus = request.status;
    const newStatus = req.body.status;

    Object.assign(request, req.body);
    await request.save();

    // Update statistics if status changed to/from completed
    if (oldStatus !== newStatus) {
      const stats = await Statistics.getStatistics();
      
      // If changed to completed
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        stats.totalGlassCollected += request.glassQuantity;
        stats.completedRequests += 1;
        stats.co2Saved += request.glassQuantity * 0.3;
      }
      // If changed from completed
      else if (oldStatus === 'completed' && newStatus !== 'completed') {
        if (stats.totalGlassCollected >= request.glassQuantity) {
          stats.totalGlassCollected -= request.glassQuantity;
        }
        if (stats.completedRequests > 0) {
          stats.completedRequests -= 1;
        }
        if (stats.co2Saved >= request.glassQuantity * 0.3) {
          stats.co2Saved -= request.glassQuantity * 0.3;
        }
      }
      
      stats.lastUpdated = new Date();
      await stats.save();
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/requests/:id
// @desc    Delete a request (admin only)
// @access  Private (Admin)
router.delete('/requests/:id', adminAuth, async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await request.deleteOne();

    // Update statistics
    const stats = await Statistics.getStatistics();
    if (stats.totalRequests > 0) stats.totalRequests -= 1;
    if (request.status === 'completed' && stats.completedRequests > 0) {
      stats.completedRequests -= 1;
    }
    await stats.save();

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (admin only)
// @access  Private (Admin)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user (admin only)
// @access  Private (Admin)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow updating password directly here
    const { password, ...updateData } = req.body;
    Object.assign(user, updateData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/messages
// @desc    Get all messages (admin view)
// @access  Private (Admin)
router.get('/messages', adminAuth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find()
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .populate('requestId', 'entityName')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/messages/:id
// @desc    Delete a message (admin only)
// @access  Private (Admin)
router.delete('/messages/:id', adminAuth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

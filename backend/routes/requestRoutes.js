const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CollectionRequest = require('../models/CollectionRequest');
const User = require('../models/User');
const Statistics = require('../models/Statistics');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/security');
const { notifyNewRequest, notifyRequestAccepted, notifyRequestCompleted, notifyRequestCancelled } = require('../utils/notificationHelper');

// @route   POST /api/requests
// @desc    Create a new collection request
// @access  Private (Users only, not collectors)
router.post('/', auth, [
  body('entityName').notEmpty().withMessage('Entity name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('location.lat').isNumeric().withMessage('Valid latitude is required'),
  body('location.lng').isNumeric().withMessage('Valid longitude is required'),
  body('glassQuantity').isNumeric().withMessage('Glass quantity is required'),
], async (req, res) => {
  try {
    // Only users can create requests, not collectors
    if (req.user.role === 'collector') {
      return res.status(403).json({ message: 'Collectors cannot create collection requests. They can only accept them.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const request = new CollectionRequest({
      ...req.body,
      userId: req.user._id
    });

    await request.save();

    // Update statistics
    const stats = await Statistics.getStatistics();
    stats.totalRequests += 1;
    await stats.save();

    // Emit notification to collectors and create notifications
    const io = req.app.get('io');
    if (io) {
      io.emit('new-request', request);
    }
    await notifyNewRequest(request, io);

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/requests
// @desc    Get all collection requests
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = {};

    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'collector') {
      if (status) query.status = status;
      // Collectors see all pending requests or their accepted ones
      if (!status || status === 'pending') {
        query.$or = [
          { status: 'pending' },
          { collectorId: req.user._id }
        ];
      } else {
        query.collectorId = req.user._id;
      }
    } else if (req.user.role === 'admin') {
      if (status) query.status = status;
    }

    const requests = await CollectionRequest.find(query)
      .populate('userId', 'name email phone entityType')
      .populate('collectorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get a single collection request
// @access  Private
router.get('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id)
      .populate('userId', 'name email phone entityType address location')
      .populate('collectorId', 'name email phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        request.userId._id.toString() !== req.user._id.toString() &&
        (!request.collectorId || request.collectorId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a collection request (collector only)
// @access  Private (Collector)
router.put('/:id/accept', auth, validateObjectId(), async (req, res) => {
  try {
    if (req.user.role !== 'collector' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only collectors can accept requests' });
    }

    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not available' });
    }

    request.status = 'accepted';
    request.collectorId = req.user._id;
    request.scheduledDate = req.body.scheduledDate || new Date();

    await request.save();

    // Create automatic welcome message from collector to request owner
    try {
      const welcomeMessage = new Message({
        senderId: req.user._id, // Collector
        receiverId: request.userId, // Request owner
        requestId: request._id,
        content: `مرحباً! لقد قبلت طلب جمع الزجاج الخاص بك. سأقوم بزيارتك في أقرب وقت ممكن.`
      });
      await welcomeMessage.save();

      // Populate the message for socket emission
      const populatedMessage = await Message.findById(welcomeMessage._id)
        .populate('senderId', 'name email entityType')
        .populate('receiverId', 'name email entityType');

      // Emit new message notification
      const io = req.app.get('io');
      if (io) {
        io.emit('new-message', populatedMessage);
      }
    } catch (messageError) {
      console.error('Error creating welcome message:', messageError);
      // Don't fail the request acceptance if message creation fails
    }

    // Emit notification
    const io = req.app.get('io');
    if (io) {
      io.emit('request-accepted', request);
    }

    // Get collector info for notification
    const collector = await User.findById(req.user._id).select('name email');
    
    // Create notification for request owner
    await notifyRequestAccepted(request, collector, io);

    res.json(request);
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/complete
// @desc    Mark request as completed
// @access  Private
router.put('/:id/complete', auth, validateObjectId(), async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only collector or admin can complete
    if (req.user.role !== 'admin' && 
        (!request.collectorId || request.collectorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    request.status = 'completed';
    request.completedDate = new Date();
    
    // Award points (1 point per kg)
    const points = Math.floor(request.glassQuantity);
    request.pointsAwarded = points;

    // Update user points
    const user = await User.findById(request.userId);
    if (user) {
      user.points += points;
      await user.save();
    }

    // Update statistics
    const stats = await Statistics.getStatistics();
    stats.totalGlassCollected += request.glassQuantity;
    stats.completedRequests += 1;
    // CO2 saved: approximately 0.3 kg CO2 per kg of glass recycled
    stats.co2Saved += request.glassQuantity * 0.3;
    await stats.save();

    await request.save();

    // Create notification for request owner
    const io = req.app.get('io');
    await notifyRequestCompleted(request, io);

    res.json(request);
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id
// @desc    Update a collection request
// @access  Private
router.put('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(request, req.body);
    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/cancel
// @desc    Cancel a collection request (only if pending)
// @access  Private
router.put('/:id/cancel', auth, validateObjectId(), async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check authorization - only request owner can cancel
    if (request.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation if request is pending (not accepted)
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot cancel request. It has already been accepted by a collector.' 
      });
    }

    request.status = 'cancelled';
    await request.save();

    // Update statistics - don't decrease totalRequests for cancellation
    // Just mark it as cancelled, totalRequests should reflect all requests ever created
    const stats = await Statistics.getStatistics();
    stats.lastUpdated = new Date();
    await stats.save();

    // Create notification for collector if request was accepted
    const io = req.app.get('io');
    await notifyRequestCancelled(request, io);

    res.json(request);
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Delete a collection request
// @access  Private (Admin or request owner)
router.delete('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const request = await CollectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update statistics before deletion
    const stats = await Statistics.getStatistics();
    if (stats.totalRequests > 0) stats.totalRequests -= 1;
    if (request.status === 'completed') {
      if (stats.completedRequests > 0) stats.completedRequests -= 1;
      if (stats.totalGlassCollected >= request.glassQuantity) {
        stats.totalGlassCollected -= request.glassQuantity;
      }
      if (stats.co2Saved >= request.glassQuantity * 0.3) {
        stats.co2Saved -= request.glassQuantity * 0.3;
      }
    }
    await stats.save();

    await request.deleteOne();
    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const { notifyNewMessage } = require('../utils/notificationHelper');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, requestId, content, isSupport } = req.body;

    // If it's a support message, find admin user(s)
    let finalReceiverId = receiverId;
    if (isSupport) {
      const User = require('../models/User');
      // Get first available admin (or you can send to all admins)
      const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (!admin) {
        return res.status(404).json({ message: 'No admin found. Please contact support.' });
      }
      finalReceiverId = admin._id;
    }

    const message = new Message({
      senderId: req.user._id,
      receiverId: finalReceiverId,
      requestId: requestId || null,
      content: isSupport ? `[دعم] ${content}` : content
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email entityType role')
      .populate('receiverId', 'name email entityType role');

    // Emit real-time message to both sender and receiver
    const io = req.app.get('io');
    if (io) {
      // Emit to receiver's room
      io.to(`user_${finalReceiverId}`).emit('receive-message', populatedMessage);
      // Emit to sender's room
      io.to(`user_${req.user._id}`).emit('receive-message', populatedMessage);
      
      // If it's a support message, also emit to all admin rooms
      if (isSupport) {
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' }).select('_id');
        admins.forEach(admin => {
          io.to(`user_${admin._id}`).emit('receive-message', populatedMessage);
        });
      }
      
      // Also emit globally for conversation list updates
      io.emit('new-message', populatedMessage);
    }

    // Create notification for new message
    await notifyNewMessage(populatedMessage, io);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/admin
// @desc    Get admin user(s) for support messages
// @access  Private
router.get('/admin', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    // Get first available admin (primary support contact)
    const admin = await User.findOne({ role: 'admin' })
      .select('_id name email role')
      .sort({ createdAt: 1 }); // Get oldest admin (likely primary)
    
    if (!admin) {
      return res.status(404).json({ message: 'No admin found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/admins
// @desc    Get all admin users (for admin dashboard)
// @access  Private (Admin only)
router.get('/admins', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' })
      .select('_id name email role createdAt')
      .sort({ createdAt: 1 });
    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get list of conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    let query = {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    };

    // If user is admin, also include support messages sent to any admin
    if (req.user.role === 'admin') {
      const User = require('../models/User');
      const adminIds = await User.find({ role: 'admin' }).select('_id');
      const adminIdsArray = adminIds.map(a => a._id);
      
      query = {
        $or: [
          { senderId: req.user._id },
          { receiverId: req.user._id },
          // Support messages sent to any admin
          {
            receiverId: { $in: adminIdsArray },
            content: { $regex: /^\[دعم\]/ }
          }
        ]
      };
    }

    // Get all messages where user is sender or receiver
    const messages = await Message.find(query)
      .populate('senderId', 'name email entityType role')
      .populate('receiverId', 'name email entityType role')
      .sort({ createdAt: -1 });

    // Get unique users from conversations
    const usersMap = new Map();
    messages.forEach(message => {
      let otherUser;
      
      // For admins viewing support messages, show the sender (the user who requested support)
      if (req.user.role === 'admin' && 
          message.content?.startsWith('[دعم]') && 
          message.receiverId?.role === 'admin') {
        otherUser = message.senderId;
      } else {
        // Normal case: get the other user in the conversation
        otherUser = message.senderId._id.toString() === req.user._id.toString()
          ? message.receiverId
          : message.senderId;
      }
      
      if (otherUser && !usersMap.has(otherUser._id.toString())) {
        usersMap.set(otherUser._id.toString(), {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          entityType: otherUser.entityType,
          role: otherUser.role
        });
      }
    });

    res.json(Array.from(usersMap.values()));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages
// @desc    Get messages for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { requestId, userId } = req.query;
    let query = {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    };

    if (requestId) {
      query.requestId = requestId;
    }

    if (userId) {
      query = {
        $or: [
          { senderId: req.user._id, receiverId: userId },
          { senderId: userId, receiverId: req.user._id }
        ]
      };
    }

    // If user is admin, also show support messages sent to any admin
    if (req.user.role === 'admin') {
      const User = require('../models/User');
      const adminIds = await User.find({ role: 'admin' }).select('_id');
      const adminIdsArray = adminIds.map(a => a._id);
      
      // Include messages where any admin is receiver and content starts with [دعم]
      query = {
        $or: [
          { senderId: req.user._id },
          { receiverId: req.user._id },
          // Support messages sent to any admin
          {
            receiverId: { $in: adminIdsArray },
            content: { $regex: /^\[دعم\]/ }
          }
        ]
      };
      
      if (requestId) {
        query.requestId = requestId;
      }
      
      if (userId) {
        query = {
          $or: [
            { senderId: req.user._id, receiverId: userId },
            { senderId: userId, receiverId: req.user._id },
            // Support messages with this user
            {
              senderId: userId,
              receiverId: { $in: adminIdsArray },
              content: { $regex: /^\[دعم\]/ }
            }
          ]
        };
      }
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email entityType role')
      .populate('receiverId', 'name email entityType role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

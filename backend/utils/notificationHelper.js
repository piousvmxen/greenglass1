const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper function to create notifications
const createNotification = async (userId, type, title, message, options = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedRequestId: options.relatedRequestId || null,
      relatedMessageId: options.relatedMessageId || null,
      relatedUserId: options.relatedUserId || null
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create notification for new request (to all collectors)
const notifyNewRequest = async (request, io) => {
  try {
    const collectors = await User.find({ role: 'collector' }).select('_id');
    
    for (const collector of collectors) {
      await createNotification(
        collector._id,
        'new_request',
        'طلب جمع جديد',
        `طلب جديد من ${request.entityName || 'مستخدم'} - الكمية: ${request.glassQuantity} كجم`,
        { relatedRequestId: request._id, relatedUserId: request.userId }
      );
    }

    // Emit socket event to all collectors
    if (io) {
      collectors.forEach(collector => {
        io.to(`user_${collector._id}`).emit('new-notification', {
          type: 'new_request',
          requestId: request._id
        });
      });
    }
  } catch (error) {
    console.error('Error notifying new request:', error);
  }
};

// Create notification for request accepted (to request owner)
const notifyRequestAccepted = async (request, collector, io) => {
  try {
    await createNotification(
      request.userId,
      'request_accepted',
      'تم قبول طلبك',
      `تم قبول طلب جمع الزجاج الخاص بك من قبل ${collector.name || 'جامع'}`,
      { relatedRequestId: request._id, relatedUserId: collector._id }
    );

    // Emit socket event
    if (io) {
      io.to(`user_${request.userId}`).emit('new-notification', {
        type: 'request_accepted',
        requestId: request._id
      });
    }
  } catch (error) {
    console.error('Error notifying request accepted:', error);
  }
};

// Create notification for request completed (to request owner)
const notifyRequestCompleted = async (request, io) => {
  try {
    await createNotification(
      request.userId,
      'request_completed',
      'تم إكمال طلبك',
      `تم إكمال طلب جمع الزجاج الخاص بك. تم منحك ${request.pointsAwarded || 0} نقطة`,
      { relatedRequestId: request._id }
    );

    // Emit socket event
    if (io) {
      io.to(`user_${request.userId}`).emit('new-notification', {
        type: 'request_completed',
        requestId: request._id
      });
    }
  } catch (error) {
    console.error('Error notifying request completed:', error);
  }
};

// Create notification for new message
const notifyNewMessage = async (message, io) => {
  try {
    const receiverId = message.receiverId?._id || message.receiverId;
    const senderId = message.senderId?._id || message.senderId;

    if (!receiverId) return;

    const senderName = message.senderId?.name || 'مستخدم';
    const isSupport = message.content?.startsWith('[دعم]');

    await createNotification(
      receiverId,
      'new_message',
      isSupport ? 'رسالة دعم جديدة' : 'رسالة جديدة',
      isSupport 
        ? `رسالة دعم من ${senderName}`
        : `رسالة جديدة من ${senderName}`,
      { 
        relatedMessageId: message._id,
        relatedUserId: senderId,
        relatedRequestId: message.requestId || null
      }
    );

    // If support message, notify all admins
    if (isSupport) {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      
      for (const admin of admins) {
        if (admin._id.toString() !== receiverId.toString()) {
          await createNotification(
            admin._id,
            'new_message',
            'رسالة دعم جديدة',
            `رسالة دعم من ${senderName}`,
            { 
              relatedMessageId: message._id,
              relatedUserId: senderId
            }
          );
        }
      }

      // Emit to all admins
      if (io) {
        admins.forEach(admin => {
          io.to(`user_${admin._id}`).emit('new-notification', {
            type: 'new_message',
            messageId: message._id
          });
        });
      }
    } else {
      // Emit to receiver
      if (io) {
        io.to(`user_${receiverId}`).emit('new-notification', {
          type: 'new_message',
          messageId: message._id
        });
      }
    }
  } catch (error) {
    console.error('Error notifying new message:', error);
  }
};

// Create notification for request cancelled
const notifyRequestCancelled = async (request, io) => {
  try {
    // Notify collector if request was accepted
    if (request.collectorId) {
      await createNotification(
        request.collectorId,
        'request_cancelled',
        'تم إلغاء طلب',
        `تم إلغاء طلب جمع الزجاج الذي قبلته`,
        { relatedRequestId: request._id, relatedUserId: request.userId }
      );

      // Emit socket event
      if (io) {
        io.to(`user_${request.collectorId}`).emit('new-notification', {
          type: 'request_cancelled',
          requestId: request._id
        });
      }
    }
  } catch (error) {
    console.error('Error notifying request cancelled:', error);
  }
};

module.exports = {
  createNotification,
  notifyNewRequest,
  notifyRequestAccepted,
  notifyRequestCompleted,
  notifyNewMessage,
  notifyRequestCancelled
};

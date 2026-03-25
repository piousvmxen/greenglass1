const mongoose = require('mongoose');

const collectionRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entityName: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['individual', 'cafe', 'restaurant', 'hotel', 'factory', 'workshop', 'other'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  glassQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  glassType: {
    type: String,
    enum: ['bottles', 'windows', 'broken', 'mixed'],
    default: 'mixed'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

collectionRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CollectionRequest', collectionRequestSchema);

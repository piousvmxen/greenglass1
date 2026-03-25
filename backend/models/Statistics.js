const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
  totalGlassCollected: {
    type: Number,
    default: 0 // in kg
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  completedRequests: {
    type: Number,
    default: 0
  },
  activeCollectors: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  co2Saved: {
    type: Number,
    default: 0 // in kg
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Singleton pattern - only one statistics document
statisticsSchema.statics.getStatistics = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({});
  }
  return stats;
};

module.exports = mongoose.model('Statistics', statisticsSchema);

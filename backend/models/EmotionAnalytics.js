const mongoose = require('mongoose');

const emotionAnalyticsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  emotionalMetrics: {
    moodScore: { type: Number, min: 1, max: 10, required: true },
    stressLevel: { type: Number, min: 1, max: 10, required: true },
    energyLevel: { type: Number, min: 1, max: 10, required: true },
    satisfaction: { type: Number, min: 1, max: 10, required: true },
    engagement: { type: Number, min: 1, max: 10, required: true },
    wellBeing: { type: Number, min: 1, max: 10, required: true }
  },
  emotionalTrends: {
    dailyMood: [{ type: Number }],
    weeklyPattern: {
      monday: { type: Number },
      tuesday: { type: Number },
      wednesday: { type: Number },
      thursday: { type: Number },
      friday: { type: Number },
      saturday: { type: Number },
      sunday: { type: Number }
    },
    monthlyTrend: {
      week1: { type: Number },
      week2: { type: Number },
      week3: { type: Number },
      week4: { type: Number }
    }
  },
  emotionalInsights: {
    topEmotions: [{ type: String }],
    emotionalTriggers: [{ type: String }],
    emotionalNeeds: [{ type: String }],
    recommendations: [{ type: String }],
    concerns: [{ type: String }],
    positiveFactors: [{ type: String }]
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmotionConversation',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
emotionAnalyticsSchema.index({ tenantId: 1, date: -1 });
emotionAnalyticsSchema.index({ tenantId: 1, userId: 1, date: -1 });
emotionAnalyticsSchema.index({ 'emotionalMetrics.moodScore': 1 });
emotionAnalyticsSchema.index({ 'emotionalMetrics.stressLevel': 1 });

module.exports = mongoose.model('EmotionAnalytics', emotionAnalyticsSchema);

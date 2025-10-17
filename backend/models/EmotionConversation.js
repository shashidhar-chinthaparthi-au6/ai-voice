const mongoose = require('mongoose');

const emotionConversationSchema = new mongoose.Schema({
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
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  conversationType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  questions: [{
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    userResponse: { type: String, required: true },
    emotionAnalysis: {
      primaryEmotion: { type: String, required: true },
      intensity: { type: Number, min: 1, max: 10, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true },
      triggers: [{ type: String }],
      context: { type: String },
      needs: [{ type: String }],
      sentiment: { type: Number, min: -1, max: 1 }
    },
    timestamp: { type: Date, default: Date.now }
  }],
  overallEmotion: {
    dominantEmotion: { type: String },
    averageIntensity: { type: Number, min: 1, max: 10 },
    emotionalState: { type: String },
    wellBeingScore: { type: Number, min: 1, max: 10 },
    stressLevel: { type: Number, min: 1, max: 10 },
    energyLevel: { type: Number, min: 1, max: 10 },
    satisfaction: { type: Number, min: 1, max: 10 }
  },
  insights: {
    emotionalPatterns: [{ type: String }],
    concerns: [{ type: String }],
    positiveFactors: [{ type: String }],
    recommendations: [{ type: String }],
    keyTopics: [{ type: String }]
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Indexes for efficient querying
emotionConversationSchema.index({ tenantId: 1, userId: 1 });
emotionConversationSchema.index({ tenantId: 1, createdAt: -1 });
emotionConversationSchema.index({ sessionId: 1 });
emotionConversationSchema.index({ 'overallEmotion.dominantEmotion': 1 });

// Update the updatedAt field before saving
emotionConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmotionConversation', emotionConversationSchema);

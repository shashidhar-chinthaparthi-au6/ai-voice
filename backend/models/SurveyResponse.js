const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  respondentId: {
    type: String,
    required: true
  },
  responses: [{
    questionId: { type: String, required: true },
    answer: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    browser: String,
    os: String,
    language: String,
    timezone: String
  },
  analytics: {
    completionTime: Number,
    skippedQuestions: [String],
    totalQuestions: Number,
    answeredQuestions: Number
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
surveyResponseSchema.index({ tenantId: 1, surveyId: 1 });
surveyResponseSchema.index({ tenantId: 1, respondentId: 1 });
surveyResponseSchema.index({ surveyId: 1, status: 1 });
surveyResponseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);

const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'multiple_choice', 'rating', 'yes_no'],
      required: true
    },
    text: { type: String, required: true },
    options: [String],
    required: { type: Boolean, default: false },
    order: { type: Number, required: true }
  }],
  settings: {
    allowAnonymous: { type: Boolean, default: true },
    requireAuthentication: { type: Boolean, default: false },
    maxResponses: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    language: { type: String, default: 'en' }
  },
  analytics: {
    totalResponses: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
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

// Indexes for efficient querying
surveySchema.index({ tenantId: 1, isActive: 1 });
surveySchema.index({ tenantId: 1, createdBy: 1 });
surveySchema.index({ 'settings.isActive': 1 });

// Update the updatedAt field before saving
surveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Survey', surveySchema);

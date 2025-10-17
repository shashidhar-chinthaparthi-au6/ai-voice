const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Demographics
  demographics: {
    age: { type: Number, min: 18, max: 100 },
    gender: { type: String, enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] },
    department: { type: String },
    role: { type: String },
    experience: { type: String, enum: ['entry', 'mid', 'senior', 'executive'] },
    tenure: { type: Number }, // years in company
    education: { type: String },
    location: { type: String }
  },
  // Preferences and settings
  preferences: {
    communicationStyle: { type: String, enum: ['direct', 'diplomatic', 'analytical', 'expressive'] },
    preferredTimeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening'] },
    preferredDayOfWeek: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    conversationFrequency: { type: String, enum: ['daily', 'weekly', 'bi_weekly', 'monthly'] },
    privacyLevel: { type: String, enum: ['high', 'medium', 'low'] },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  // Baseline metrics for comparison
  baselineMetrics: {
    emotionalBaseline: {
      mood: { type: Number, min: 1, max: 10 },
      stress: { type: Number, min: 1, max: 10 },
      energy: { type: Number, min: 1, max: 10 },
      satisfaction: { type: Number, min: 1, max: 10 }
    },
    behavioralBaseline: {
      responseTime: { type: Number },
      engagementLevel: { type: Number, min: 1, max: 10 },
      opennessLevel: { type: Number, min: 1, max: 10 }
    },
    establishedAt: { type: Date, default: Date.now },
    sampleSize: { type: Number, default: 0 }
  },
  // Risk factors and indicators
  riskFactors: {
    stressIndicators: [{ type: String }],
    emotionalTriggers: [{ type: String }],
    supportNeeds: [{ type: String }],
    interventionHistory: [{
      date: { type: Date },
      type: { type: String },
      outcome: { type: String },
      effectiveness: { type: Number, min: 1, max: 10 }
    }]
  },
  // Goals and objectives
  goals: {
    personal: [{ type: String }],
    professional: [{ type: String }],
    emotional: [{ type: String }],
    setDate: { type: Date, default: Date.now },
    reviewDate: { type: Date }
  },
  // Support network
  supportNetwork: {
    manager: { type: String },
    mentor: { type: String },
    peerSupport: [{ type: String }],
    externalSupport: [{ type: String }],
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
      email: { type: String }
    }
  },
  // Analytics preferences
  analyticsPreferences: {
    shareData: { type: Boolean, default: true },
    includeInAggregates: { type: Boolean, default: true },
    receiveInsights: { type: Boolean, default: true },
    dataRetentionPeriod: { type: Number, default: 365 } // days
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
userProfileSchema.index({ tenantId: 1, userId: 1 });
userProfileSchema.index({ 'demographics.department': 1 });
userProfileSchema.index({ 'demographics.role': 1 });
userProfileSchema.index({ 'riskFactors.stressIndicators': 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);

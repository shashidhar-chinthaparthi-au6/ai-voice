const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  settings: {
    theme: {
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' },
      logo: { type: String, default: '' }
    },
    features: {
      aiAnalysis: { type: Boolean, default: true },
      customQuestions: { type: Boolean, default: false },
      analytics: { type: Boolean, default: true }
    },
    limits: {
      maxSurveys: { type: Number, default: 10 },
      maxResponses: { type: Number, default: 1000 },
      maxUsers: { type: Number, default: 50 }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled'],
      default: 'active'
    },
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for efficient tenant lookup
tenantSchema.index({ domain: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
tenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);

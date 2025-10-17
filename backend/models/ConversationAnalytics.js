const mongoose = require('mongoose');

const ConversationAnalyticsSchema = new mongoose.Schema({
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
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmotionConversation',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  conversationType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  // Overall conversation metrics
  metrics: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    aiMessages: { type: Number, default: 0 },
    conversationDuration: { type: Number, default: 0 }, // in seconds
    averageResponseTime: { type: Number, default: 0 }, // in seconds
    sentimentScore: { type: Number, default: 0 }, // -1 to 1
    emotionalIntensity: { type: Number, default: 0 }, // 1 to 10
    wellBeingScore: { type: Number, default: 0 }, // 1 to 10
    stressLevel: { type: Number, default: 0 }, // 1 to 10
    energyLevel: { type: Number, default: 0 }, // 1 to 10
    satisfactionLevel: { type: Number, default: 0 } // 1 to 10
  },
  // Emotional insights
  emotionalInsights: {
    dominantEmotions: [{ 
      emotion: String, 
      intensity: Number, 
      frequency: Number 
    }],
    emotionalTriggers: [{ 
      trigger: String, 
      frequency: Number, 
      impact: Number 
    }],
    emotionalNeeds: [{ 
      need: String, 
      frequency: Number, 
      priority: Number 
    }],
    moodPatterns: [{ 
      pattern: String, 
      frequency: Number, 
      description: String 
    }]
  },
  // Topic analysis
  topics: [{
    topic: String,
    frequency: Number,
    sentiment: Number,
    keywords: [String]
  }],
  // Conversation quality metrics
  qualityMetrics: {
    engagement: { type: Number, default: 0 }, // 1 to 10
    openness: { type: Number, default: 0 }, // 1 to 10
    trust: { type: Number, default: 0 }, // 1 to 10
    satisfaction: { type: Number, default: 0 }, // 1 to 10
    helpfulness: { type: Number, default: 0 } // 1 to 10
  },
  // AI response analysis
  aiPerformance: {
    responseRelevance: { type: Number, default: 0 }, // 1 to 10
    empathyLevel: { type: Number, default: 0 }, // 1 to 10
    questionQuality: { type: Number, default: 0 }, // 1 to 10
    contextualAwareness: { type: Number, default: 0 } // 1 to 10
  },
  // Recommendations
  recommendations: [{
    type: String, // 'emotional_support', 'workplace_improvement', 'personal_development'
    priority: String, // 'high', 'medium', 'low'
    description: String,
    actionable: Boolean
  }],
  // Raw conversation data for reference
  conversationSummary: {
    keyPoints: [String],
    concerns: [String],
    positiveAspects: [String],
    areasForImprovement: [String]
  },
  // Contextual factors analysis
  contextualAnalysis: {
    timeOfDay: String,
    dayOfWeek: String,
    season: String,
    externalEvents: [String],
    workload: Number,
    weather: String,
    location: String,
    device: String,
    impactOnMood: Number, // -5 to 5
    environmentalStressors: [String],
    environmentalSupports: [String]
  },
  // Interaction pattern analysis
  interactionAnalysis: {
    conversationFlow: String,
    questionTypes: [String],
    responsePatterns: {
      averageLength: Number,
      lengthVariance: Number,
      complexityScore: Number,
      emotionalDepth: Number
    },
    engagementMetrics: {
      totalTimeSpent: Number,
      averageResponseTime: Number,
      pauseFrequency: Number,
      interruptionCount: Number,
      hesitationCount: Number,
      engagementScore: Number
    },
    effectivenessMetrics: {
      clarityScore: Number,
      depthScore: Number,
      opennessScore: Number,
      trustScore: Number,
      overallEffectiveness: Number
    }
  },
  // Historical context and trends
  historicalAnalysis: {
    previousMood: Number,
    trendDirection: String,
    recurringThemes: [String],
    progressIndicators: {
      emotionalGrowth: Number,
      stressManagement: Number,
      selfAwareness: Number,
      copingStrategies: Number
    },
    baselineComparison: {
      moodVsBaseline: Number,
      stressVsBaseline: Number,
      energyVsBaseline: Number,
      satisfactionVsBaseline: Number
    },
    trendAnalysis: {
      shortTermTrend: String, // last 7 days
      mediumTermTrend: String, // last 30 days
      longTermTrend: String, // last 90 days
      volatilityIndex: Number
    }
  },
  // Predictive insights
  predictiveInsights: {
    riskFactors: [String],
    improvementAreas: [String],
    successIndicators: [String],
    interventionRecommendations: [String],
    predictedOutcomes: {
      nextWeekMood: Number,
      nextWeekStress: Number,
      nextWeekEnergy: Number,
      confidence: Number
    },
    earlyWarningSignals: [String],
    opportunityAreas: [String]
  },
  // Comparative analytics
  comparativeAnalytics: {
    peerComparison: {
      departmentAverage: Object,
      roleAverage: Object,
      experienceLevelAverage: Object,
      percentileRanking: Number
    },
    industryBenchmarks: {
      industryAverage: Object,
      bestPractices: [String],
      benchmarkComparison: Object
    },
    personalBaseline: {
      historicalAverage: Object,
      improvementAreas: [String],
      strengthAreas: [String]
    }
  },
  // Action tracking and follow-up
  actionTracking: {
    recommendationsGiven: [{
      type: String,
      description: String,
      priority: String,
      givenAt: Date
    }],
    actionsTaken: [{
      recommendationId: String,
      action: String,
      takenAt: Date,
      outcome: String,
      effectiveness: Number
    }],
    followUpRequired: Boolean,
    followUpDate: Date,
    interventionHistory: [{
      date: Date,
      type: String,
      outcome: String,
      effectiveness: Number
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ConversationAnalyticsSchema.index({ tenantId: 1, date: -1 });
ConversationAnalyticsSchema.index({ userId: 1, date: -1 });
ConversationAnalyticsSchema.index({ conversationType: 1, date: -1 });
ConversationAnalyticsSchema.index({ 'metrics.sentimentScore': 1 });
ConversationAnalyticsSchema.index({ 'metrics.wellBeingScore': 1 });

module.exports = mongoose.model('ConversationAnalytics', ConversationAnalyticsSchema);

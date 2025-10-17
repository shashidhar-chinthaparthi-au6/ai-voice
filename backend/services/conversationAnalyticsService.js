const ConversationAnalytics = require('../models/ConversationAnalytics');
const EmotionConversation = require('../models/EmotionConversation');
const UserProfile = require('../models/UserProfile');
const OpenAI = require('openai');

class ConversationAnalyticsService {
  constructor() {
    // Initialize OpenAI with API key
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Analyze a single conversation and generate insights
  async analyzeConversation(conversationId, tenantId, userId) {
    try {
      const conversation = await EmotionConversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Extract conversation data
      const conversationData = this.extractConversationData(conversation);
      
      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(conversationData);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(conversationData);
      
      // Generate emotional insights
      const emotionalInsights = this.analyzeEmotionalContent(conversationData);
      
      // Analyze topics
      const topics = this.analyzeTopics(conversationData);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(conversationData, aiInsights);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(conversationData, aiInsights);
      
      // Analyze contextual factors
      const contextualAnalysis = this.analyzeContextualFactors(conversation);
      
      // Analyze interaction patterns
      const interactionAnalysis = this.analyzeInteractionPatterns(conversationData);
      
      // Analyze historical context
      const historicalAnalysis = await this.analyzeHistoricalContext(userId, tenantId, conversationData);
      
      // Generate predictive insights
      const predictiveInsights = await this.generatePredictiveInsights(conversationData, historicalAnalysis);
      
      // Generate comparative analytics
      const comparativeAnalytics = await this.generateComparativeAnalytics(userId, tenantId, metrics);
      
      // Initialize action tracking
      const actionTracking = this.initializeActionTracking(recommendations);
      
      // Create analytics record
      const analytics = new ConversationAnalytics({
        tenantId,
        userId,
        conversationId,
        conversationType: conversation.conversationType,
        metrics,
        emotionalInsights,
        topics,
        qualityMetrics,
        aiPerformance: aiInsights.aiPerformance,
        recommendations,
        conversationSummary: aiInsights.summary,
        contextualAnalysis,
        interactionAnalysis,
        historicalAnalysis,
        predictiveInsights,
        comparativeAnalytics,
        actionTracking
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  // Extract structured data from conversation
  extractConversationData(conversation) {
    const messages = [];
    let totalDuration = 0;
    let responseTimes = [];

    // Process questions and responses
    conversation.questions.forEach((question, index) => {
      messages.push({
        type: 'ai',
        content: question.questionText,
        timestamp: question.timestamp
      });
      
      messages.push({
        type: 'user',
        content: question.userResponse,
        timestamp: question.timestamp,
        emotionAnalysis: question.emotionAnalysis
      });

      // Calculate response time (simplified)
      if (index > 0) {
        const prevQuestion = conversation.questions[index - 1];
        const responseTime = new Date(question.timestamp) - new Date(prevQuestion.timestamp);
        responseTimes.push(responseTime / 1000); // Convert to seconds
      }
    });

    return {
      messages,
      totalDuration,
      responseTimes,
      conversationType: conversation.conversationType,
      overallEmotion: conversation.overallEmotion,
      insights: conversation.insights
    };
  }

  // Generate AI-powered insights using OpenAI
  async generateAIInsights(conversationData) {
    try {

      const conversationText = conversationData.messages
        .map(msg => `${msg.type === 'ai' ? 'AI' : 'User'}: ${msg.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and provide comprehensive insights. Focus on:
            1. Emotional patterns and triggers
            2. Key concerns and positive aspects
            3. Areas for improvement
            4. AI performance and empathy
            5. Actionable recommendations
            
            Respond with a JSON object containing:
            - emotionalPatterns: array of objects with emotion (string), intensity (number), frequency (number)
            - triggers: array of objects with trigger (string), frequency (number), impact (number)
            - needs: array of objects with need (string), frequency (number), priority (number)
            - concerns: array of strings
            - positiveAspects: array of strings
            - aiPerformance: object with responseRelevance (number), empathyLevel (number), questionQuality (number), contextualAwareness (number)
            - summary: object with keyPoints (array of strings), concerns (array of strings), positiveAspects (array of strings), areasForImprovement (array of strings)
            - recommendations: array of strings
            
            IMPORTANT: Return ONLY valid JSON, no additional text or formatting. All numbers must be actual numbers, not strings.`
          },
          {
            role: 'user',
            content: `Conversation:\n${conversationText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getDefaultInsights();
    }
  }

  // Calculate basic metrics
  calculateMetrics(conversationData) {
    const userMessages = conversationData.messages.filter(msg => msg.type === 'user');
    const aiMessages = conversationData.messages.filter(msg => msg.type === 'ai');
    
    // Calculate sentiment scores
    const sentimentScores = userMessages
      .map(msg => msg.emotionAnalysis?.sentiment || 0)
      .filter(score => score !== 0);
    
    const avgSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    // Calculate emotional intensity
    const intensities = userMessages
      .map(msg => msg.emotionAnalysis?.intensity || 5)
      .filter(intensity => intensity !== 5);
    
    const avgIntensity = intensities.length > 0 
      ? intensities.reduce((a, b) => a + b, 0) / intensities.length 
      : 5;

    // Calculate response times
    const avgResponseTime = conversationData.responseTimes.length > 0
      ? conversationData.responseTimes.reduce((a, b) => a + b, 0) / conversationData.responseTimes.length
      : 0;

    return {
      totalMessages: conversationData.messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      conversationDuration: conversationData.totalDuration,
      averageResponseTime: avgResponseTime,
      sentimentScore: avgSentiment,
      emotionalIntensity: avgIntensity,
      wellBeingScore: conversationData.overallEmotion?.wellBeingScore || 5,
      stressLevel: conversationData.overallEmotion?.stressLevel || 5,
      energyLevel: conversationData.overallEmotion?.energyLevel || 5,
      satisfactionLevel: conversationData.overallEmotion?.satisfaction || 5
    };
  }

  // Analyze emotional content
  analyzeEmotionalContent(conversationData) {
    const emotions = {};
    const triggers = {};
    const needs = {};

    conversationData.messages
      .filter(msg => msg.type === 'user' && msg.emotionAnalysis)
      .forEach(msg => {
        const analysis = msg.emotionAnalysis;
        
        // Count emotions
        if (analysis.primaryEmotion) {
          emotions[analysis.primaryEmotion] = (emotions[analysis.primaryEmotion] || 0) + 1;
        }
        
        // Count triggers
        if (analysis.triggers) {
          analysis.triggers.forEach(trigger => {
            triggers[trigger] = (triggers[trigger] || 0) + 1;
          });
        }
        
        // Count needs
        if (analysis.needs) {
          analysis.needs.forEach(need => {
            needs[need] = (needs[need] || 0) + 1;
          });
        }
      });

    return {
      dominantEmotions: Object.entries(emotions)
        .map(([emotion, frequency]) => ({ emotion, frequency, intensity: 5 }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      emotionalTriggers: Object.entries(triggers)
        .map(([trigger, frequency]) => ({ trigger, frequency, impact: 5 }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      emotionalNeeds: Object.entries(needs)
        .map(([need, frequency]) => ({ need, frequency, priority: 5 }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
      moodPatterns: []
    };
  }

  // Analyze topics
  analyzeTopics(conversationData) {
    const topicKeywords = {
      'work': ['work', 'job', 'office', 'meeting', 'project', 'deadline', 'manager', 'colleague'],
      'stress': ['stress', 'stressed', 'overwhelmed', 'pressure', 'anxiety', 'worried'],
      'relationships': ['relationship', 'family', 'friend', 'partner', 'team', 'social'],
      'health': ['health', 'sick', 'tired', 'energy', 'sleep', 'exercise', 'wellness'],
      'goals': ['goal', 'future', 'career', 'plan', 'dream', 'aspiration', 'ambition']
    };

    const topics = {};
    const userMessages = conversationData.messages.filter(msg => msg.type === 'user');

    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword));
        if (matches.length > 0) {
          topics[topic] = (topics[topic] || 0) + matches.length;
        }
      });
    });

    return Object.entries(topics)
      .map(([topic, frequency]) => ({
        topic,
        frequency,
        sentiment: 0, // Could be calculated based on sentiment analysis
        keywords: topicKeywords[topic]
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  // Calculate quality metrics
  calculateQualityMetrics(conversationData, aiInsights) {
    const userMessages = conversationData.messages.filter(msg => msg.type === 'user');
    const avgMessageLength = userMessages.length > 0
      ? userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
      : 0;

    return {
      engagement: Math.min(10, Math.max(1, avgMessageLength / 10)), // Based on message length
      openness: Math.min(10, Math.max(1, userMessages.length * 2)), // Based on number of responses
      trust: 7, // Default value, could be calculated based on conversation depth
      satisfaction: conversationData.overallEmotion?.satisfaction || 5,
      helpfulness: aiInsights.aiPerformance?.helpfulness || 7
    };
  }

  // Generate recommendations
  generateRecommendations(conversationData, aiInsights) {
    const recommendations = [];
    
    // Based on emotional insights
    if (conversationData.overallEmotion?.stressLevel > 7) {
      recommendations.push({
        type: 'emotional_support',
        priority: 'high',
        description: 'High stress levels detected. Consider stress management techniques.',
        actionable: true
      });
    }

    if (conversationData.overallEmotion?.wellBeingScore < 4) {
      recommendations.push({
        type: 'personal_development',
        priority: 'high',
        description: 'Low well-being score. Focus on self-care and positive activities.',
        actionable: true
      });
    }

    // Based on topics discussed
    const topics = this.analyzeTopics(conversationData);
    if (topics.some(t => t.topic === 'work' && t.frequency > 3)) {
      recommendations.push({
        type: 'workplace_improvement',
        priority: 'medium',
        description: 'Work-related concerns identified. Consider workplace support resources.',
        actionable: true
      });
    }

    return recommendations;
  }

  // Get default insights when AI analysis fails
  getDefaultInsights() {
    return {
      emotionalPatterns: [],
      triggers: [],
      needs: [],
      concerns: [],
      positiveAspects: [],
      aiPerformance: {
        empathy: 7,
        relevance: 7,
        questionQuality: 7,
        contextualAwareness: 7
      },
      summary: {
        keyPoints: [],
        concerns: [],
        positiveAspects: [],
        areasForImprovement: []
      },
      recommendations: []
    };
  }

  // Get aggregated analytics for dashboard
  async getDashboardAnalytics(tenantId, timeRange = '30d') {
    try {
      console.log('getDashboardAnalytics called with:', { tenantId, timeRange });
      
      let startDate;
      let analytics;
      
      if (typeof timeRange === 'object' && timeRange.startDate && timeRange.endDate) {
        startDate = timeRange.startDate;
        const endDate = timeRange.endDate;
        console.log('Using custom date range:', { startDate, endDate });
        analytics = await ConversationAnalytics.find({
          tenantId,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));
        console.log('Using time range:', { timeRange, startDate });
        analytics = await ConversationAnalytics.find({
          tenantId,
          date: { $gte: startDate }
        }).sort({ date: -1 });
      }

      console.log('Found analytics records:', analytics.length);
      const result = this.aggregateAnalytics(analytics);
      console.log('Aggregated result:', result);
      return result;
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  // Aggregate analytics data
  aggregateAnalytics(analytics) {
    if (analytics.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalConversations = analytics.length;
    const avgMetrics = this.calculateAverageMetrics(analytics);
    const emotionalTrends = this.calculateEmotionalTrends(analytics);
    const topTopics = this.calculateTopTopics(analytics);
    const recommendations = this.aggregateRecommendations(analytics);

    return {
      overview: {
        totalConversations,
        avgWellBeing: avgMetrics.wellBeingScore,
        avgStress: avgMetrics.stressLevel,
        avgSatisfaction: avgMetrics.satisfactionLevel,
        avgEngagement: avgMetrics.engagement
      },
      emotionalTrends,
      topTopics,
      recommendations,
      timeRange: analytics.map(a => ({
        date: a.date,
        wellBeing: a.metrics.wellBeingScore,
        stress: a.metrics.stressLevel,
        satisfaction: a.metrics.satisfactionLevel
      }))
    };
  }

  calculateAverageMetrics(analytics) {
    const totals = analytics.reduce((acc, curr) => ({
      wellBeingScore: acc.wellBeingScore + curr.metrics.wellBeingScore,
      stressLevel: acc.stressLevel + curr.metrics.stressLevel,
      satisfactionLevel: acc.satisfactionLevel + curr.metrics.satisfactionLevel,
      engagement: acc.engagement + curr.qualityMetrics.engagement
    }), { wellBeingScore: 0, stressLevel: 0, satisfactionLevel: 0, engagement: 0 });

    return {
      wellBeingScore: totals.wellBeingScore / analytics.length,
      stressLevel: totals.stressLevel / analytics.length,
      satisfactionLevel: totals.satisfactionLevel / analytics.length,
      engagement: totals.engagement / analytics.length
    };
  }

  calculateEmotionalTrends(analytics) {
    const emotions = {};
    analytics.forEach(analytics => {
      analytics.emotionalInsights.dominantEmotions.forEach(emotion => {
        emotions[emotion.emotion] = (emotions[emotion.emotion] || 0) + emotion.frequency;
      });
    });

    return Object.entries(emotions)
      .map(([emotion, frequency]) => ({ emotion, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  calculateTopTopics(analytics) {
    const topics = {};
    analytics.forEach(analytics => {
      analytics.topics.forEach(topic => {
        topics[topic.topic] = (topics[topic.topic] || 0) + topic.frequency;
      });
    });

    return Object.entries(topics)
      .map(([topic, frequency]) => ({ topic, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  aggregateRecommendations(analytics) {
    const recommendations = {};
    analytics.forEach(analytics => {
      analytics.recommendations.forEach(rec => {
        const key = `${rec.type}-${rec.priority}`;
        recommendations[key] = (recommendations[key] || 0) + 1;
      });
    });

    return Object.entries(recommendations)
      .map(([key, count]) => {
        const [type, priority] = key.split('-');
        return { type, priority, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  getEmptyAnalytics() {
    return {
      overview: {
        totalConversations: 0,
        avgWellBeing: 0,
        avgStress: 0,
        avgSatisfaction: 0,
        avgEngagement: 0
      },
      emotionalTrends: [],
      topTopics: [],
      recommendations: [],
      timeRange: []
    };
  }

  // Calculate trends over time
  calculateTrends(analytics, granularity = 'daily') {
    const trends = {};
    
    analytics.forEach(analytics => {
      const date = new Date(analytics.date);
      let key;
      
      if (granularity === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (granularity === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!trends[key]) {
        trends[key] = {
          date: key,
          wellBeing: [],
          stress: [],
          satisfaction: [],
          engagement: []
        };
      }
      
      trends[key].wellBeing.push(analytics.metrics.wellBeingScore);
      trends[key].stress.push(analytics.metrics.stressLevel);
      trends[key].satisfaction.push(analytics.metrics.satisfactionLevel);
      trends[key].engagement.push(analytics.qualityMetrics.engagement);
    });
    
    // Calculate averages for each period
    return Object.values(trends).map(period => ({
      date: period.date,
      wellBeing: period.wellBeing.reduce((a, b) => a + b, 0) / period.wellBeing.length,
      stress: period.stress.reduce((a, b) => a + b, 0) / period.stress.length,
      satisfaction: period.satisfaction.reduce((a, b) => a + b, 0) / period.satisfaction.length,
      engagement: period.engagement.reduce((a, b) => a + b, 0) / period.engagement.length
    }));
  }

  // Analyze topics from analytics
  analyzeTopics(analytics) {
    const topics = {};
    
    // Handle both single analytics object and array
    const analyticsArray = Array.isArray(analytics) ? analytics : [analytics];
    
    analyticsArray.forEach(analyticsItem => {
      if (analyticsItem && analyticsItem.topics) {
        analyticsItem.topics.forEach(topic => {
          if (!topics[topic.topic]) {
            topics[topic.topic] = {
              topic: topic.topic,
              frequency: 0,
              sentiment: 0,
              keywords: topic.keywords || []
            };
          }
          topics[topic.topic].frequency += topic.frequency;
          topics[topic.topic].sentiment += topic.sentiment;
        });
      }
    });
    
    // Calculate average sentiment
    const topicCount = Object.keys(topics).length;
    if (topicCount > 0) {
      Object.values(topics).forEach(topic => {
        topic.sentiment = topic.sentiment / analyticsArray.length;
      });
    }
    
    return Object.values(topics)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  // Analyze contextual factors
  analyzeContextualFactors(conversation) {
    const contextualFactors = conversation.contextualFactors || {};
    const now = new Date();
    
    return {
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: this.getDayOfWeek(now),
      season: this.getSeason(now),
      externalEvents: contextualFactors.externalEvents || [],
      workload: contextualFactors.workload || 5,
      weather: contextualFactors.weather || 'unknown',
      location: contextualFactors.location || 'unknown',
      device: contextualFactors.device || 'unknown',
      impactOnMood: this.calculateEnvironmentalImpact(contextualFactors),
      environmentalStressors: this.identifyEnvironmentalStressors(contextualFactors),
      environmentalSupports: this.identifyEnvironmentalSupports(contextualFactors)
    };
  }

  // Analyze interaction patterns
  analyzeInteractionPatterns(conversationData) {
    const questions = conversationData.messages.filter(msg => msg.type === 'ai');
    const responses = conversationData.messages.filter(msg => msg.type === 'user');
    
    return {
      conversationFlow: this.determineConversationFlow(questions),
      questionTypes: this.extractQuestionTypes(questions),
      responsePatterns: {
        averageLength: this.calculateAverageResponseLength(responses),
        lengthVariance: this.calculateResponseLengthVariance(responses),
        complexityScore: this.calculateComplexityScore(responses),
        emotionalDepth: this.calculateEmotionalDepth(responses)
      },
      engagementMetrics: {
        totalTimeSpent: conversationData.totalDuration,
        averageResponseTime: this.calculateAverageResponseTime(conversationData),
        pauseFrequency: this.calculatePauseFrequency(conversationData),
        interruptionCount: this.calculateInterruptionCount(conversationData),
        hesitationCount: this.calculateHesitationCount(conversationData),
        engagementScore: this.calculateEngagementScore(conversationData)
      },
      effectivenessMetrics: {
        clarityScore: this.calculateClarityScore(conversationData),
        depthScore: this.calculateDepthScore(conversationData),
        opennessScore: this.calculateOpennessScore(conversationData),
        trustScore: this.calculateTrustScore(conversationData),
        overallEffectiveness: this.calculateOverallEffectiveness(conversationData)
      }
    };
  }

  // Analyze historical context
  async analyzeHistoricalContext(userId, tenantId, conversationData) {
    try {
      // Get user profile for baseline
      const userProfile = await UserProfile.findOne({ userId, tenantId });
      
      // Get recent conversations for trend analysis
      const recentConversations = await EmotionConversation.find({
        userId,
        tenantId,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      }).sort({ createdAt: -1 });

      return {
        previousMood: this.calculatePreviousMood(recentConversations),
        trendDirection: this.calculateTrendDirection(recentConversations),
        recurringThemes: this.identifyRecurringThemes(recentConversations),
        progressIndicators: this.calculateProgressIndicators(recentConversations),
        baselineComparison: this.calculateBaselineComparison(conversationData, userProfile),
        trendAnalysis: this.analyzeTrends(recentConversations)
      };
    } catch (error) {
      console.error('Error analyzing historical context:', error);
      return this.getDefaultHistoricalAnalysis();
    }
  }

  // Generate predictive insights
  async generatePredictiveInsights(conversationData, historicalAnalysis) {
    try {

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation data and provide predictive insights. Focus on:
            1. Risk factors and early warning signs
            2. Areas for improvement
            3. Success indicators
            4. Intervention recommendations
            5. Predicted outcomes for next week
            
            Respond with a JSON object containing:
            - riskFactors: array of strings
            - improvementAreas: array of strings
            - successIndicators: array of strings
            - interventionRecommendations: array of strings
            - predictedOutcomes: object with nextWeekMood (number 1-10), nextWeekStress (number 1-10), nextWeekEnergy (number 1-10), confidence (number 0-1)
            - earlyWarningSignals: array of strings
            - opportunityAreas: array of strings
            
            IMPORTANT: Return ONLY valid JSON, no additional text or formatting. All numbers must be actual numbers, not strings.`
          },
          {
            role: 'user',
            content: `Conversation Data: ${JSON.stringify(conversationData)}\nHistorical Analysis: ${JSON.stringify(historicalAnalysis)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return this.getDefaultPredictiveInsights();
    }
  }

  // Generate comparative analytics
  async generateComparativeAnalytics(userId, tenantId, metrics) {
    try {
      // Get user profile for demographic comparison
      const userProfile = await UserProfile.findOne({ userId, tenantId });
      
      // Get peer data for comparison
      const peerData = await this.getPeerComparisonData(tenantId, userProfile);
      
      // Get industry benchmarks (mock data for now)
      const industryBenchmarks = this.getIndustryBenchmarks();
      
      // Calculate personal baseline
      const personalBaseline = await this.calculatePersonalBaseline(userId, tenantId);

      return {
        peerComparison: {
          departmentAverage: peerData.department,
          roleAverage: peerData.role,
          experienceLevelAverage: peerData.experience,
          percentileRanking: this.calculatePercentileRanking(metrics, peerData)
        },
        industryBenchmarks: {
          industryAverage: industryBenchmarks.average,
          bestPractices: industryBenchmarks.bestPractices,
          benchmarkComparison: this.compareToBenchmarks(metrics, industryBenchmarks)
        },
        personalBaseline: {
          historicalAverage: personalBaseline.average,
          improvementAreas: personalBaseline.improvementAreas,
          strengthAreas: personalBaseline.strengthAreas
        }
      };
    } catch (error) {
      console.error('Error generating comparative analytics:', error);
      return this.getDefaultComparativeAnalytics();
    }
  }

  // Initialize action tracking
  initializeActionTracking(recommendations) {
    return {
      recommendationsGiven: recommendations.map(rec => ({
        type: rec.type,
        description: rec.description,
        priority: rec.priority,
        givenAt: new Date()
      })),
      actionsTaken: [],
      followUpRequired: recommendations.some(rec => rec.priority === 'high'),
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      interventionHistory: []
    };
  }

  // Helper methods for contextual analysis
  getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  getSeason(date) {
    const month = date.getMonth();
    if (month < 3) return 'spring';
    if (month < 6) return 'summer';
    if (month < 9) return 'autumn';
    return 'winter';
  }

  calculateEnvironmentalImpact(contextualFactors) {
    // Simple impact calculation based on various factors
    let impact = 0;
    if (contextualFactors.workload > 7) impact -= 2;
    if (contextualFactors.weather === 'sunny') impact += 1;
    if (contextualFactors.location === 'home') impact += 1;
    return Math.max(-5, Math.min(5, impact));
  }

  identifyEnvironmentalStressors(contextualFactors) {
    const stressors = [];
    if (contextualFactors.workload > 7) stressors.push('high_workload');
    if (contextualFactors.weather === 'stormy') stressors.push('bad_weather');
    if (contextualFactors.location === 'office') stressors.push('work_environment');
    return stressors;
  }

  identifyEnvironmentalSupports(contextualFactors) {
    const supports = [];
    if (contextualFactors.weather === 'sunny') supports.push('good_weather');
    if (contextualFactors.location === 'home') supports.push('comfortable_environment');
    return supports;
  }

  // Helper methods for interaction analysis
  determineConversationFlow(questions) {
    // Simple heuristic to determine flow type
    if (questions.length < 3) return 'linear';
    if (questions.length > 8) return 'adaptive';
    return 'branching';
  }

  extractQuestionTypes(questions) {
    return questions.map(q => q.questionType || 'open_ended');
  }

  calculateAverageResponseLength(responses) {
    if (responses.length === 0) return 0;
    return responses.reduce((sum, r) => sum + (r.content?.length || 0), 0) / responses.length;
  }

  calculateResponseLengthVariance(responses) {
    if (responses.length < 2) return 0;
    const lengths = responses.map(r => r.content?.length || 0);
    const avg = this.calculateAverageResponseLength(responses);
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
    return Math.sqrt(variance);
  }

  calculateComplexityScore(responses) {
    if (!responses || responses.length === 0) return 5;
    // Simple complexity score based on response length and emotional content
    const avgLength = this.calculateAverageResponseLength(responses);
    const emotionalDepth = responses.filter(r => r.emotionAnalysis?.intensity > 7).length / responses.length;
    const score = Math.min(10, (avgLength / 50) + (emotionalDepth * 5));
    return isNaN(score) ? 5 : score;
  }

  calculateEmotionalDepth(responses) {
    if (!responses || responses.length === 0) return 5;
    const emotionalResponses = responses.filter(r => r.emotionAnalysis?.intensity > 5);
    const depth = emotionalResponses.length / responses.length * 10;
    return isNaN(depth) ? 5 : depth;
  }

  calculateAverageResponseTime(conversationData) {
    if (conversationData.responseTimes.length === 0) return 0;
    return conversationData.responseTimes.reduce((sum, time) => sum + time, 0) / conversationData.responseTimes.length;
  }

  calculatePauseFrequency(conversationData) {
    // Mock calculation - would need actual pause data
    return conversationData.responseTimes.length * 0.3;
  }

  calculateInterruptionCount(conversationData) {
    // Mock calculation - would need actual interruption data
    return Math.floor(conversationData.responseTimes.length * 0.1);
  }

  calculateHesitationCount(conversationData) {
    // Mock calculation - would need actual hesitation data
    return Math.floor(conversationData.responseTimes.length * 0.2);
  }

  calculateEngagementScore(conversationData) {
    const responseTime = this.calculateAverageResponseTime(conversationData);
    const messageCount = conversationData.messages.length;
    const duration = conversationData.totalDuration;
    
    // Simple engagement score calculation
    let score = 5; // Base score
    if (responseTime < 30) score += 2; // Quick responses
    if (messageCount > 5) score += 2; // More interaction
    if (duration > 300) score += 1; // Longer conversation
    
    return Math.min(10, Math.max(1, score));
  }

  calculateClarityScore(conversationData) {
    // Mock calculation - would analyze response clarity
    return 7;
  }

  calculateDepthScore(conversationData) {
    // Mock calculation - would analyze response depth
    return 6;
  }

  calculateOpennessScore(conversationData) {
    // Mock calculation - would analyze openness indicators
    return 7;
  }

  calculateTrustScore(conversationData) {
    // Mock calculation - would analyze trust indicators
    return 6;
  }

  calculateOverallEffectiveness(conversationData) {
    const clarity = this.calculateClarityScore(conversationData);
    const depth = this.calculateDepthScore(conversationData);
    const openness = this.calculateOpennessScore(conversationData);
    const trust = this.calculateTrustScore(conversationData);
    
    return (clarity + depth + openness + trust) / 4;
  }

  // Helper methods for historical analysis
  calculatePreviousMood(recentConversations) {
    if (recentConversations.length === 0) return 5;
    const lastConversation = recentConversations[0];
    return lastConversation.overallEmotion?.wellBeingScore || 5;
  }

  calculateTrendDirection(recentConversations) {
    if (recentConversations.length < 2) return 'stable';
    
    const recent = recentConversations.slice(0, 3);
    const older = recentConversations.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, c) => sum + (c.overallEmotion?.wellBeingScore || 5), 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + (c.overallEmotion?.wellBeingScore || 5), 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  identifyRecurringThemes(recentConversations) {
    const themes = {};
    recentConversations.forEach(conv => {
      if (conv.insights?.keyTopics) {
        conv.insights.keyTopics.forEach(topic => {
          themes[topic] = (themes[topic] || 0) + 1;
        });
      }
    });
    
    return Object.entries(themes)
      .filter(([_, count]) => count > 1)
      .map(([topic, _]) => topic);
  }

  calculateProgressIndicators(recentConversations) {
    return {
      emotionalGrowth: 6, // Mock calculation
      stressManagement: 7,
      selfAwareness: 6,
      copingStrategies: 5
    };
  }

  calculateBaselineComparison(conversationData, userProfile) {
    if (!userProfile?.baselineMetrics) {
      return { moodVsBaseline: 0, stressVsBaseline: 0, energyVsBaseline: 0, satisfactionVsBaseline: 0 };
    }
    
    const baseline = userProfile.baselineMetrics.emotionalBaseline;
    return {
      moodVsBaseline: conversationData.overallEmotion?.wellBeingScore - baseline.mood,
      stressVsBaseline: conversationData.overallEmotion?.stressLevel - baseline.stress,
      energyVsBaseline: conversationData.overallEmotion?.energyLevel - baseline.energy,
      satisfactionVsBaseline: conversationData.overallEmotion?.satisfaction - baseline.satisfaction
    };
  }

  analyzeTrends(recentConversations) {
    return {
      shortTermTrend: 'stable', // Mock calculation
      mediumTermTrend: 'improving',
      longTermTrend: 'stable',
      volatilityIndex: 3
    };
  }

  // Helper methods for comparative analytics
  async getPeerComparisonData(tenantId, userProfile) {
    // Mock peer data - would query actual peer data
    return {
      department: { avgWellBeing: 6.5, avgStress: 5.2 },
      role: { avgWellBeing: 6.8, avgStress: 4.9 },
      experience: { avgWellBeing: 7.1, avgStress: 4.5 }
    };
  }

  getIndustryBenchmarks() {
    // Mock industry benchmarks
    return {
      average: { wellBeing: 6.5, stress: 5.0, satisfaction: 6.8 },
      bestPractices: ['regular_check_ins', 'stress_management_training', 'work_life_balance']
    };
  }

  calculatePercentileRanking(metrics, peerData) {
    // Mock percentile calculation
    return 75; // 75th percentile
  }

  compareToBenchmarks(metrics, benchmarks) {
    return {
      wellBeing: metrics.wellBeingScore - benchmarks.average.wellBeing,
      stress: metrics.stressLevel - benchmarks.average.stress,
      satisfaction: metrics.satisfactionLevel - benchmarks.average.satisfaction
    };
  }

  async calculatePersonalBaseline(userId, tenantId) {
    // Mock personal baseline calculation
    return {
      average: { wellBeing: 6.2, stress: 5.5, satisfaction: 6.5 },
      improvementAreas: ['stress_management', 'work_life_balance'],
      strengthAreas: ['emotional_awareness', 'communication']
    };
  }

  // Default values for error cases
  getDefaultHistoricalAnalysis() {
    return {
      previousMood: 5,
      trendDirection: 'stable',
      recurringThemes: [],
      progressIndicators: { emotionalGrowth: 5, stressManagement: 5, selfAwareness: 5, copingStrategies: 5 },
      baselineComparison: { moodVsBaseline: 0, stressVsBaseline: 0, energyVsBaseline: 0, satisfactionVsBaseline: 0 },
      trendAnalysis: { shortTermTrend: 'stable', mediumTermTrend: 'stable', longTermTrend: 'stable', volatilityIndex: 5 }
    };
  }

  getDefaultPredictiveInsights() {
    return {
      riskFactors: [],
      improvementAreas: [],
      successIndicators: [],
      interventionRecommendations: [],
      predictedOutcomes: { nextWeekMood: 5, nextWeekStress: 5, nextWeekEnergy: 5, confidence: 0.5 },
      earlyWarningSignals: [],
      opportunityAreas: []
    };
  }

  getDefaultComparativeAnalytics() {
    return {
      peerComparison: { departmentAverage: {}, roleAverage: {}, experienceLevelAverage: {}, percentileRanking: 50 },
      industryBenchmarks: { industryAverage: {}, bestPractices: [], benchmarkComparison: {} },
      personalBaseline: { historicalAverage: {}, improvementAreas: [], strengthAreas: [] }
    };
  }
}

module.exports = new ConversationAnalyticsService();

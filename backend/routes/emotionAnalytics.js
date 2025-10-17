const express = require('express');
const EmotionAnalytics = require('../models/EmotionAnalytics');
const EmotionConversation = require('../models/EmotionConversation');
const emotionAIService = require('../services/emotionAIService');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get emotion analytics overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = { tenantId: req.tenant._id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Get aggregated emotion data
    const emotionData = await EmotionAnalytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          averageSatisfaction: { $avg: '$emotionalMetrics.satisfaction' },
          averageEngagement: { $avg: '$emotionalMetrics.engagement' },
          averageWellBeing: { $avg: '$emotionalMetrics.wellBeing' },
          totalConversations: { $sum: 1 }
        }
      }
    ]);

    // Get emotion distribution
    const emotionDistribution = await EmotionAnalytics.aggregate([
      { $match: dateFilter },
      { $unwind: '$emotionalInsights.topEmotions' },
      {
        $group: {
          _id: '$emotionalInsights.topEmotions',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent conversations count
    const recentConversations = await EmotionConversation.countDocuments({
      tenantId: req.tenant._id,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const overview = {
      metrics: emotionData[0] || {
        averageMood: 0,
        averageStress: 0,
        averageEnergy: 0,
        averageSatisfaction: 0,
        averageEngagement: 0,
        averageWellBeing: 0,
        totalConversations: 0
      },
      emotionDistribution: emotionDistribution,
      recentConversations: recentConversations
    };

    res.json({ overview });
  } catch (error) {
    console.error('Get emotion overview error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch emotion overview'
    });
  }
});

// Get emotion trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d', granularity = 'daily' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let groupFormat;
    switch (granularity) {
      case 'hourly':
        groupFormat = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          hour: { $hour: '$date' }
        };
        break;
      case 'daily':
        groupFormat = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'weekly':
        groupFormat = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
    }

    const trends = await EmotionAnalytics.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          averageSatisfaction: { $avg: '$emotionalMetrics.satisfaction' },
          averageEngagement: { $avg: '$emotionalMetrics.engagement' },
          averageWellBeing: { $avg: '$emotionalMetrics.wellBeing' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({ trends });
  } catch (error) {
    console.error('Get emotion trends error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch emotion trends'
    });
  }
});

// Get emotion heatmap data
router.get('/heatmap', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const heatmapData = await EmotionAnalytics.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$date' },
            hour: { $hour: '$date' }
          },
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          hour: '$_id.hour',
          averageMood: 1,
          averageStress: 1,
          averageEnergy: 1,
          count: 1
        }
      }
    ]);

    res.json({ heatmapData });
  } catch (error) {
    console.error('Get emotion heatmap error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch emotion heatmap'
    });
  }
});

// Get emotional insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get recent conversations for insights
    const conversations = await EmotionConversation.find({
      tenantId: req.tenant._id,
      status: 'completed',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).limit(100);

    // Extract insights from conversations
    const allInsights = conversations.flatMap(conv => conv.insights);
    
    const insights = {
      topConcerns: [],
      topPositiveFactors: [],
      topRecommendations: [],
      topTopics: [],
      emotionalPatterns: []
    };

    // Aggregate insights
    const concernCounts = {};
    const positiveCounts = {};
    const recommendationCounts = {};
    const topicCounts = {};

    allInsights.forEach(insight => {
      // Count concerns
      insight.concerns?.forEach(concern => {
        concernCounts[concern] = (concernCounts[concern] || 0) + 1;
      });

      // Count positive factors
      insight.positiveFactors?.forEach(factor => {
        positiveCounts[factor] = (positiveCounts[factor] || 0) + 1;
      });

      // Count recommendations
      insight.recommendations?.forEach(rec => {
        recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
      });

      // Count topics
      insight.keyTopics?.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    // Sort and get top items
    insights.topConcerns = Object.entries(concernCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([concern, count]) => ({ concern, count }));

    insights.topPositiveFactors = Object.entries(positiveCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    insights.topRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([recommendation, count]) => ({ recommendation, count }));

    insights.topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    res.json({ insights });
  } catch (error) {
    console.error('Get emotional insights error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch emotional insights'
    });
  }
});

// Get user-specific emotion analytics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Verify user can access this data
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own emotion analytics'
      });
    }

    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's emotion analytics
    const userAnalytics = await EmotionAnalytics.find({
      tenantId: req.tenant._id,
      userId: userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Get user's emotion patterns
    const patterns = await emotionAIService.trackEmotionalPatterns(userId, timeRange);

    // Calculate user metrics
    const metrics = {
      averageMood: 0,
      averageStress: 0,
      averageEnergy: 0,
      averageSatisfaction: 0,
      totalConversations: userAnalytics.length
    };

    if (userAnalytics.length > 0) {
      metrics.averageMood = userAnalytics.reduce((sum, a) => sum + a.emotionalMetrics.moodScore, 0) / userAnalytics.length;
      metrics.averageStress = userAnalytics.reduce((sum, a) => sum + a.emotionalMetrics.stressLevel, 0) / userAnalytics.length;
      metrics.averageEnergy = userAnalytics.reduce((sum, a) => sum + a.emotionalMetrics.energyLevel, 0) / userAnalytics.length;
      metrics.averageSatisfaction = userAnalytics.reduce((sum, a) => sum + a.emotionalMetrics.satisfaction, 0) / userAnalytics.length;
    }

    res.json({
      metrics: metrics,
      patterns: patterns,
      analytics: userAnalytics
    });
  } catch (error) {
    console.error('Get user emotion analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user emotion analytics'
    });
  }
});

// Generate AI-powered emotion report
router.post('/generate-report', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30d', reportType = 'comprehensive' } = req.body;

    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get emotion data for the period
    const emotionData = await EmotionAnalytics.find({
      tenantId: req.tenant._id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Get conversations for insights
    const conversations = await EmotionConversation.find({
      tenantId: req.tenant._id,
      status: 'completed',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Generate AI-powered report
    const report = {
      period: timeRange,
      generatedAt: new Date(),
      summary: {
        totalConversations: conversations.length,
        averageMood: emotionData.reduce((sum, d) => sum + d.emotionalMetrics.moodScore, 0) / (emotionData.length || 1),
        averageStress: emotionData.reduce((sum, d) => sum + d.emotionalMetrics.stressLevel, 0) / (emotionData.length || 1),
        averageEnergy: emotionData.reduce((sum, d) => sum + d.emotionalMetrics.energyLevel, 0) / (emotionData.length || 1)
      },
      trends: emotionData.map(d => ({
        date: d.date,
        mood: d.emotionalMetrics.moodScore,
        stress: d.emotionalMetrics.stressLevel,
        energy: d.emotionalMetrics.energyLevel
      })),
      insights: {
        topEmotions: [],
        topConcerns: [],
        topPositiveFactors: [],
        recommendations: []
      }
    };

    // Extract insights from conversations
    const allInsights = conversations.flatMap(conv => conv.insights);
    
    // Aggregate insights
    const emotionCounts = {};
    const concernCounts = {};
    const positiveCounts = {};
    const recommendationCounts = {};

    allInsights.forEach(insight => {
      insight.emotionalPatterns?.forEach(pattern => {
        emotionCounts[pattern] = (emotionCounts[pattern] || 0) + 1;
      });
      insight.concerns?.forEach(concern => {
        concernCounts[concern] = (concernCounts[concern] || 0) + 1;
      });
      insight.positiveFactors?.forEach(factor => {
        positiveCounts[factor] = (positiveCounts[factor] || 0) + 1;
      });
      insight.recommendations?.forEach(rec => {
        recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
      });
    });

    report.insights.topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    report.insights.topConcerns = Object.entries(concernCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([concern, count]) => ({ concern, count }));

    report.insights.topPositiveFactors = Object.entries(positiveCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    report.insights.recommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([recommendation, count]) => ({ recommendation, count }));

    res.json({ report });
  } catch (error) {
    console.error('Generate emotion report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate emotion report'
    });
  }
});

// Get department emotion analytics (Admin only)
router.get('/departments', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get department breakdown
    const departmentData = await EmotionAnalytics.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          date: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          totalUsers: { $addToSet: '$userId' },
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          totalConversations: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          totalUsers: { $size: '$totalUsers' },
          averageMood: { $round: ['$averageMood', 1] },
          averageStress: { $round: ['$averageStress', 1] },
          averageEnergy: { $round: ['$averageEnergy', 1] },
          totalConversations: 1
        }
      },
      { $sort: { averageMood: -1 } }
    ]);

    res.json({ departments: departmentData });
  } catch (error) {
    console.error('Get department analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch department analytics'
    });
  }
});

// Get organization-wide emotion analytics (Admin only)
router.get('/organization', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get organization-wide metrics
    const orgData = await EmotionAnalytics.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $addToSet: '$userId' },
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          averageSatisfaction: { $avg: '$emotionalMetrics.satisfaction' },
          averageEngagement: { $avg: '$emotionalMetrics.engagement' },
          averageWellBeing: { $avg: '$emotionalMetrics.wellBeing' },
          totalConversations: { $sum: 1 }
        }
      },
      {
        $project: {
          totalUsers: { $size: '$totalUsers' },
          averageMood: { $round: ['$averageMood', 1] },
          averageStress: { $round: ['$averageStress', 1] },
          averageEnergy: { $round: ['$averageEnergy', 1] },
          averageSatisfaction: { $round: ['$averageSatisfaction', 1] },
          averageEngagement: { $round: ['$averageEngagement', 1] },
          averageWellBeing: { $round: ['$averageWellBeing', 1] },
          totalConversations: 1
        }
      }
    ]);

    res.json({ organization: orgData[0] || {} });
  } catch (error) {
    console.error('Get organization analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch organization analytics'
    });
  }
});

// Get emotion heatmap data
router.get('/heatmap', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const heatmapData = await EmotionAnalytics.aggregate([
      {
        $match: {
          tenantId: req.tenant._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$date' },
            hour: { $hour: '$date' }
          },
          averageMood: { $avg: '$emotionalMetrics.moodScore' },
          averageStress: { $avg: '$emotionalMetrics.stressLevel' },
          averageEnergy: { $avg: '$emotionalMetrics.energyLevel' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          hour: '$_id.hour',
          averageMood: { $round: ['$averageMood', 1] },
          averageStress: { $round: ['$averageStress', 1] },
          averageEnergy: { $round: ['$averageEnergy', 1] },
          count: 1
        }
      },
      { $sort: { dayOfWeek: 1, hour: 1 } }
    ]);

    res.json({ heatmap: heatmapData });
  } catch (error) {
    console.error('Get heatmap data error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch heatmap data'
    });
  }
});

module.exports = router;

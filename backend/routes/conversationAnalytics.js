const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const conversationAnalyticsService = require('../services/conversationAnalyticsService');
const ConversationAnalytics = require('../models/ConversationAnalytics');

const router = express.Router();

// Test endpoint to verify API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Conversation Analytics API is working',
    timestamp: new Date().toISOString()
  });
});

// Get dashboard analytics overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('Dashboard analytics request received');
    console.log('Tenant ID:', req.tenant?._id);
    console.log('User ID:', req.user?._id);
    
    const { timeRange = '30d', startDate, endDate } = req.query;
    console.log('Query params:', { timeRange, startDate, endDate });
    
    let analytics;
    if (startDate && endDate) {
      console.log('Using custom date range');
      analytics = await conversationAnalyticsService.getDashboardAnalytics(
        req.tenant._id, 
        { startDate: new Date(startDate), endDate: new Date(endDate) }
      );
    } else {
      console.log('Using time range:', timeRange);
      analytics = await conversationAnalyticsService.getDashboardAnalytics(
        req.tenant._id, 
        timeRange
      );
    }

    console.log('Analytics result:', analytics);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      details: error.message
    });
  }
});

// Get detailed conversation analytics
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, conversationType, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { tenantId: req.tenant._id };
    
    if (userId) query.userId = userId;
    if (conversationType) query.conversationType = conversationType;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const analytics = await ConversationAnalytics.find(query)
      .populate('userId', 'name email')
      .populate('conversationId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ConversationAnalytics.countDocuments(query);

    res.json({
      success: true,
      data: {
        analytics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Conversation analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation analytics'
    });
  }
});

// Get user-specific analytics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Verify user belongs to tenant
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - You can only view your own analytics'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

    const analytics = await ConversationAnalytics.find({
      tenantId: req.tenant._id,
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    const aggregatedData = conversationAnalyticsService.aggregateAnalytics(analytics);

    res.json({
      success: true,
      data: {
        userAnalytics: aggregatedData,
        individualConversations: analytics
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

// Get emotional trends over time
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d', granularity = 'daily' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

    const analytics = await ConversationAnalytics.find({
      tenantId: req.tenant._id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const trends = conversationAnalyticsService.calculateTrends(analytics, granularity);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends analytics'
    });
  }
});

// Get topic analysis
router.get('/topics', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

    const analytics = await ConversationAnalytics.find({
      tenantId: req.tenant._id,
      date: { $gte: startDate }
    });

    const topicAnalysis = conversationAnalyticsService.analyzeTopics(analytics);

    res.json({
      success: true,
      data: topicAnalysis
    });
  } catch (error) {
    console.error('Topic analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topic analysis'
    });
  }
});

// Get recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

    const analytics = await ConversationAnalytics.find({
      tenantId: req.tenant._id,
      date: { $gte: startDate }
    });

    const recommendations = conversationAnalyticsService.aggregateRecommendations(analytics);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// Analyze specific conversation
router.post('/analyze/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const analytics = await conversationAnalyticsService.analyzeConversation(
      conversationId,
      req.tenant._id,
      req.user._id
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Conversation analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze conversation'
    });
  }
});

// Get filters and options for dashboard
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.tenant._id;

    // Get unique conversation types
    const conversationTypes = await ConversationAnalytics.distinct('conversationType', {
      tenantId: req.tenant._id
    });

    // Get date range
    const dateRange = await ConversationAnalytics.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: null,
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        conversationTypes,
        dateRange: dateRange[0] || { minDate: null, maxDate: null }
      }
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filters'
    });
  }
});

module.exports = router;

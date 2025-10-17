const express = require('express');
const { body, validationResult } = require('express-validator');
const EmotionConversation = require('../models/EmotionConversation');
const EmotionAnalytics = require('../models/EmotionAnalytics');
const emotionAIService = require('../services/emotionAIService');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Start new emotion conversation
router.post('/start', authenticateToken, [
  body('conversationType').isIn(['daily', 'weekly', 'monthly', 'custom']),
  body('questions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { conversationType, questions } = req.body;
    const sessionId = uuidv4();
    
    // Generate questions if not provided
    const conversationQuestions = questions || emotionAIService.generateEmotionQuestions(conversationType);
    
    const conversation = new EmotionConversation({
      tenantId: req.tenant._id,
      userId: req.user._id,
      sessionId: sessionId,
      conversationType: conversationType,
      questions: [],
      status: 'in_progress'
    });

    await conversation.save();

    res.status(201).json({
      message: 'Emotion conversation started',
      sessionId: sessionId,
      questions: conversationQuestions,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start emotion conversation'
    });
  }
});

// Submit emotion response
router.post('/:sessionId/respond', authenticateToken, [
  body('questionId').notEmpty(),
  body('questionText').notEmpty(),
  body('userResponse').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { sessionId } = req.params;
    const { questionId, questionText, userResponse } = req.body;

    // Find conversation
    const conversation = await EmotionConversation.findOne({
      sessionId: sessionId,
      tenantId: req.tenant._id,
      userId: req.user._id,
      status: 'in_progress'
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        message: 'The conversation session does not exist or has ended'
      });
    }

    // Analyze emotion
    const emotionAnalysis = await emotionAIService.analyzeEmotion(userResponse, 'workplace');

    // Add question response
    conversation.questions.push({
      questionId: questionId,
      questionText: questionText,
      userResponse: userResponse,
      emotionAnalysis: emotionAnalysis,
      timestamp: new Date()
    });

    await conversation.save();

    res.json({
      message: 'Emotion response recorded',
      emotionAnalysis: emotionAnalysis,
      questionCount: conversation.questions.length
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record emotion response'
    });
  }
});

// Complete emotion conversation
router.post('/:sessionId/complete', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find conversation
    const conversation = await EmotionConversation.findOne({
      sessionId: sessionId,
      tenantId: req.tenant._id,
      userId: req.user._id,
      status: 'in_progress'
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        message: 'The conversation session does not exist or has ended'
      });
    }

    // Analyze overall emotion
    const overallEmotion = await emotionAIService.analyzeOverallEmotion(conversation);
    conversation.overallEmotion = overallEmotion;

    // Generate insights
    const insights = await emotionAIService.generateEmotionalInsights(conversation);
    conversation.insights = insights;

    // Mark as completed
    conversation.status = 'completed';
    conversation.completedAt = new Date();

    await conversation.save();

    // Create emotion analytics record
    const emotionAnalytics = new EmotionAnalytics({
      tenantId: req.tenant._id,
      userId: req.user._id,
      date: new Date(),
      emotionalMetrics: {
        moodScore: overallEmotion.wellBeingScore,
        stressLevel: overallEmotion.stressLevel,
        energyLevel: overallEmotion.energyLevel,
        satisfaction: overallEmotion.satisfaction,
        engagement: overallEmotion.averageIntensity,
        wellBeing: overallEmotion.wellBeingScore
      },
      emotionalInsights: insights,
      conversationId: conversation._id
    });

    await emotionAnalytics.save();

    res.json({
      message: 'Emotion conversation completed',
      overallEmotion: overallEmotion,
      insights: insights,
      analyticsId: emotionAnalytics._id
    });
  } catch (error) {
    console.error('Complete conversation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete emotion conversation'
    });
  }
});

// Get emotion conversation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, conversationType } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      tenantId: req.tenant._id,
      userId: req.user._id,
      status: 'completed'
    };

    if (conversationType) {
      query.conversationType = conversationType;
    }

    const conversations = await EmotionConversation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('sessionId conversationType overallEmotion insights createdAt completedAt');

    const total = await EmotionConversation.countDocuments(query);

    res.json({
      conversations: conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch conversation history'
    });
  }
});

// Get specific emotion conversation
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await EmotionConversation.findOne({
      sessionId: sessionId,
      tenantId: req.tenant._id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        message: 'The conversation session does not exist'
      });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch conversation'
    });
  }
});

// Get emotion patterns for user
router.get('/patterns/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Verify user belongs to tenant
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own emotion patterns'
      });
    }

    const patterns = await emotionAIService.trackEmotionalPatterns(userId, timeRange);

    res.json({ patterns });
  } catch (error) {
    console.error('Get emotion patterns error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch emotion patterns'
    });
  }
});

// Generate AI conversation response
router.post('/generate-response', authenticateToken, [
  body('conversationContext').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { conversationContext } = req.body;

    // Generate contextual AI response using OpenAI
    const aiResponse = await emotionAIService.generateConversationalResponse(conversationContext);

    res.json({
      response: aiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Generate response error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate AI response'
    });
  }
});

module.exports = router;

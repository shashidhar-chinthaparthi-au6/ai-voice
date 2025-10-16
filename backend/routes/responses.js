const express = require('express');
const { body, validationResult } = require('express-validator');
const SurveyResponse = require('../models/SurveyResponse');
const Survey = require('../models/Survey');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();


// Submit survey response
router.post('/:surveyId', [
  body('responses').isArray({ min: 1 }),
  body('responses.*.questionId').notEmpty(),
  body('responses.*.answer').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { surveyId } = req.params;
    const { responses, metadata = {} } = req.body;
    
    // Verify survey exists and is active
    const survey = await Survey.findOne({
      _id: surveyId,
      tenantId: req.tenant._id,
      'settings.isActive': true
    });
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist or is not active'
      });
    }
    
    // Check if survey requires authentication
    if (survey.settings.requireAuthentication && !req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This survey requires authentication'
      });
    }
    
    // Check response limits
    const responseCount = await SurveyResponse.countDocuments({
      surveyId: surveyId,
      tenantId: req.tenant._id
    });
    
    if (responseCount >= survey.settings.maxResponses) {
      return res.status(403).json({
        error: 'Survey limit reached',
        message: 'This survey has reached its maximum number of responses'
      });
    }
    
    // Generate respondent ID
    const respondentId = req.user ? req.user._id.toString() : require('uuid').v4();
    
    // Process responses
    const processedResponses = responses.map(response => ({
      questionId: response.questionId,
      answer: response.answer,
      timestamp: new Date()
    }));
    
    // Calculate analytics
    const totalQuestions = survey.questions.length;
    const answeredQuestions = processedResponses.length;
    const skippedQuestions = survey.questions
      .filter(q => !processedResponses.find(r => r.questionId === q.id))
      .map(q => q.id);
    
    const surveyResponse = new SurveyResponse({
      tenantId: req.tenant._id,
      surveyId: surveyId,
      respondentId: respondentId,
      responses: processedResponses,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
        browser: getBrowserFromUserAgent(req.get('User-Agent')),
        os: getOSFromUserAgent(req.get('User-Agent')),
        language: req.get('Accept-Language')?.split(',')[0] || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...metadata
      },
      analytics: {
        totalQuestions,
        answeredQuestions,
        skippedQuestions,
        completionTime: req.body.completionTime || 0
      },
      status: 'completed',
      completedAt: new Date()
    });
    
    await surveyResponse.save();
    
    // Update survey analytics
    await updateSurveyAnalytics(surveyId);
    
    res.status(201).json({
      message: 'Survey response submitted successfully',
      responseId: surveyResponse._id
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit survey response'
    });
  }
});


// Get survey responses (authenticated users only)
router.get('/:surveyId', authenticateToken, async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Verify survey belongs to tenant
    const survey = await Survey.findOne({
      _id: surveyId,
      tenantId: req.tenant._id
    });
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }
    
    const responses = await SurveyResponse.find({
      surveyId: surveyId,
      tenantId: req.tenant._id
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await SurveyResponse.countDocuments({
      surveyId: surveyId,
      tenantId: req.tenant._id
    });
    
    res.json({
      responses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Fetch responses error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch survey responses'
    });
  }
});

// Helper function to update survey analytics
async function updateSurveyAnalytics(surveyId) {
  try {
    const responses = await SurveyResponse.find({ surveyId });
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.status === 'completed').length;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    
    const totalTime = responses.reduce((sum, r) => sum + (r.analytics.completionTime || 0), 0);
    const averageTime = totalResponses > 0 ? totalTime / totalResponses : 0;
    
    await Survey.findByIdAndUpdate(surveyId, {
      'analytics.totalResponses': totalResponses,
      'analytics.completionRate': completionRate,
      'analytics.averageTime': averageTime
    });
  } catch (error) {
    console.error('Update analytics error:', error);
  }
}

// Helper functions for user agent parsing
function getBrowserFromUserAgent(userAgent) {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOSFromUserAgent(userAgent) {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Other';
}

module.exports = router;

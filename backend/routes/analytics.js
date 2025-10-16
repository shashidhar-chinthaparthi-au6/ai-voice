const express = require('express');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get survey analytics
router.get('/survey/:surveyId', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { startDate, endDate } = req.query;
    
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
    
    // Build date filter
    let dateFilter = { surveyId: surveyId, tenantId: req.tenant._id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Get response data
    const responses = await SurveyResponse.find(dateFilter);
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalResponses: responses.length,
        completedResponses: responses.filter(r => r.status === 'completed').length,
        abandonedResponses: responses.filter(r => r.status === 'abandoned').length,
        completionRate: 0,
        averageCompletionTime: 0
      },
      demographics: {
        deviceTypes: {},
        browsers: {},
        operatingSystems: {},
        languages: {}
      },
      responses: responses.map(response => ({
        id: response._id,
        respondentId: response.respondentId,
        status: response.status,
        completionTime: response.analytics.completionTime,
        answeredQuestions: response.analytics.answeredQuestions,
        totalQuestions: response.analytics.totalQuestions,
        createdAt: response.createdAt,
        completedAt: response.completedAt
      })),
      questionAnalytics: []
    };
    
    // Calculate completion rate
    if (analytics.overview.totalResponses > 0) {
      analytics.overview.completionRate = 
        (analytics.overview.completedResponses / analytics.overview.totalResponses) * 100;
    }
    
    // Calculate average completion time
    const completedResponses = responses.filter(r => r.status === 'completed');
    if (completedResponses.length > 0) {
      const totalTime = completedResponses.reduce((sum, r) => sum + (r.analytics.completionTime || 0), 0);
      analytics.overview.averageCompletionTime = totalTime / completedResponses.length;
    }
    
    // Calculate demographics
    responses.forEach(response => {
      const meta = response.metadata;
      
      // Device types
      const deviceType = meta.deviceType || 'unknown';
      analytics.demographics.deviceTypes[deviceType] = 
        (analytics.demographics.deviceTypes[deviceType] || 0) + 1;
      
      // Browsers
      const browser = meta.browser || 'unknown';
      analytics.demographics.browsers[browser] = 
        (analytics.demographics.browsers[browser] || 0) + 1;
      
      // Operating systems
      const os = meta.os || 'unknown';
      analytics.demographics.operatingSystems[os] = 
        (analytics.demographics.operatingSystems[os] || 0) + 1;
      
      // Languages
      const language = meta.language || 'unknown';
      analytics.demographics.languages[language] = 
        (analytics.demographics.languages[language] || 0) + 1;
    });
    
    // Calculate question-level analytics
    survey.questions.forEach(question => {
      const questionResponses = responses
        .filter(r => r.status === 'completed')
        .map(r => r.responses.find(resp => resp.questionId === question.id))
        .filter(resp => resp);
      
      const questionAnalytics = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        totalAnswers: questionResponses.length,
        answerDistribution: {},
        averageSentiment: 0,
        averageConfidence: 0
      };
      
      // Calculate answer distribution
      questionResponses.forEach(response => {
        const answer = response.answer;
        if (question.type === 'multiple_choice' || question.type === 'yes_no') {
          questionAnalytics.answerDistribution[answer] = 
            (questionAnalytics.answerDistribution[answer] || 0) + 1;
        } else if (question.type === 'rating') {
          const rating = parseInt(answer);
          if (!isNaN(rating)) {
            questionAnalytics.answerDistribution[rating] = 
              (questionAnalytics.answerDistribution[rating] || 0) + 1;
          }
        }
        
        // Calculate sentiment and confidence for voice questions
        if (question.type === 'voice' && response.sentiment) {
          questionAnalytics.averageSentiment += response.sentiment.score || 0;
          questionAnalytics.averageConfidence += response.confidence || 0;
        }
      });
      
      // Calculate averages
      if (questionResponses.length > 0) {
        questionAnalytics.averageSentiment /= questionResponses.length;
        questionAnalytics.averageConfidence /= questionResponses.length;
      }
      
      analytics.questionAnalytics.push(questionAnalytics);
    });
    
    res.json({ analytics });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch survey analytics'
    });
  }
});

// Get tenant-level analytics
router.get('/tenant', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = { tenantId: req.tenant._id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Get surveys and responses
    const surveys = await Survey.find({ tenantId: req.tenant._id });
    const responses = await SurveyResponse.find(dateFilter);
    
    // Calculate tenant analytics
    const analytics = {
      overview: {
        totalSurveys: surveys.length,
        activeSurveys: surveys.filter(s => s.settings.isActive).length,
        totalResponses: responses.length,
        completedResponses: responses.filter(r => r.status === 'completed').length,
        averageCompletionRate: 0
      },
      surveyPerformance: surveys.map(survey => ({
        id: survey._id,
        title: survey.title,
        totalResponses: survey.analytics.totalResponses,
        completionRate: survey.analytics.completionRate,
        averageTime: survey.analytics.averageTime,
        isActive: survey.settings.isActive,
        createdAt: survey.createdAt
      })),
      responseTrends: await getResponseTrends(req.tenant._id, startDate, endDate),
      demographics: {
        deviceTypes: {},
        browsers: {},
        operatingSystems: {},
        languages: {}
      }
    };
    
    // Calculate average completion rate
    if (analytics.overview.totalResponses > 0) {
      analytics.overview.averageCompletionRate = 
        (analytics.overview.completedResponses / analytics.overview.totalResponses) * 100;
    }
    
    // Calculate demographics
    responses.forEach(response => {
      const meta = response.metadata;
      
      const deviceType = meta.deviceType || 'unknown';
      analytics.demographics.deviceTypes[deviceType] = 
        (analytics.demographics.deviceTypes[deviceType] || 0) + 1;
      
      const browser = meta.browser || 'unknown';
      analytics.demographics.browsers[browser] = 
        (analytics.demographics.browsers[browser] || 0) + 1;
      
      const os = meta.os || 'unknown';
      analytics.demographics.operatingSystems[os] = 
        (analytics.demographics.operatingSystems[os] || 0) + 1;
      
      const language = meta.language || 'unknown';
      analytics.demographics.languages[language] = 
        (analytics.demographics.languages[language] || 0) + 1;
    });
    
    res.json({ analytics });
  } catch (error) {
    console.error('Tenant analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant analytics'
    });
  }
});

// Helper function to get response trends
async function getResponseTrends(tenantId, startDate, endDate) {
  try {
    const pipeline = [
      {
        $match: {
          tenantId: tenantId,
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate ? { $gte: new Date(startDate) } : {}),
              ...(endDate ? { $lte: new Date(endDate) } : {})
            }
          } : {})
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ];
    
    return await SurveyResponse.aggregate(pipeline);
  } catch (error) {
    console.error('Response trends error:', error);
    return [];
  }
}

module.exports = router;

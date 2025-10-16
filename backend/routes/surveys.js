const express = require('express');
const { body, validationResult } = require('express-validator');
const Survey = require('../models/Survey');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all surveys for the tenant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { tenantId: req.tenant._id };
    
    if (status !== 'all') {
      filter['settings.isActive'] = status === 'active';
    }
    
    const surveys = await Survey.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Survey.countDocuments(filter);
    
    res.json({
      surveys,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Fetch surveys error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch surveys'
    });
  }
});

// Get single survey
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('createdBy', 'firstName lastName email');
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }
    
    res.json({ survey });
  } catch (error) {
    console.error('Fetch survey error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch survey'
    });
  }
});

// Create new survey
router.post('/', authenticateToken, requirePermission('create_surveys'), [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('questions').isArray({ min: 1 }),
  body('questions.*.text').notEmpty().trim(),
  body('questions.*.type').isIn(['voice', 'text', 'multiple_choice', 'rating', 'yes_no']),
  body('questions.*.required').optional().isBoolean(),
  body('settings.allowAnonymous').optional().isBoolean(),
  body('settings.requireAuthentication').optional().isBoolean(),
  body('settings.maxResponses').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { title, description, questions, settings = {} } = req.body;
    
    // Check tenant limits
    const surveyCount = await Survey.countDocuments({ tenantId: req.tenant._id });
    if (surveyCount >= req.tenant.settings.limits.maxSurveys) {
      return res.status(403).json({
        error: 'Limit exceeded',
        message: 'Maximum number of surveys reached for your plan'
      });
    }
    
    // Process questions and add order
    const processedQuestions = questions.map((question, index) => ({
      ...question,
      id: question.id || require('uuid').v4(),
      order: question.order || index + 1
    }));
    
    const survey = new Survey({
      tenantId: req.tenant._id,
      createdBy: req.user._id,
      title,
      description,
      questions: processedQuestions,
      settings: {
        allowAnonymous: settings.allowAnonymous !== false,
        requireAuthentication: settings.requireAuthentication || false,
        maxResponses: settings.maxResponses || 1000,
        isActive: true,
        language: settings.language || 'en',
        ...settings
      }
    });
    
    await survey.save();
    
    res.status(201).json({
      message: 'Survey created successfully',
      survey
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create survey'
    });
  }
});

// Update survey
router.put('/:id', authenticateToken, requirePermission('edit_surveys'), [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('questions').optional().isArray({ min: 1 }),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const survey = await Survey.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }
    
    const { title, description, questions, settings } = req.body;
    const updateData = {};
    
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions) {
      const processedQuestions = questions.map((question, index) => ({
        ...question,
        id: question.id || require('uuid').v4(),
        order: question.order || index + 1
      }));
      updateData.questions = processedQuestions;
    }
    if (settings) {
      updateData.settings = { ...survey.settings, ...settings };
    }
    
    const updatedSurvey = await Survey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Survey updated successfully',
      survey: updatedSurvey
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update survey'
    });
  }
});

// Delete survey
router.delete('/:id', authenticateToken, requirePermission('delete_surveys'), async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }
    
    await Survey.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete survey'
    });
  }
});

// Toggle survey active status
router.patch('/:id/toggle', authenticateToken, requirePermission('edit_surveys'), async (req, res) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });
    
    if (!survey) {
      return res.status(404).json({
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }
    
    survey.settings.isActive = !survey.settings.isActive;
    await survey.save();
    
    res.json({
      message: `Survey ${survey.settings.isActive ? 'activated' : 'deactivated'} successfully`,
      survey
    });
  } catch (error) {
    console.error('Toggle survey error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to toggle survey status'
    });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get tenant information
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        domain: req.tenant.domain,
        subdomain: req.tenant.subdomain,
        settings: req.tenant.settings,
        subscription: req.tenant.subscription,
        isActive: req.tenant.isActive,
        createdAt: req.tenant.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch tenant error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant information'
    });
  }
});

// Update tenant settings
router.put('/settings', authenticateToken, requireRole(['admin']), [
  body('theme.primaryColor').optional().isHexColor(),
  body('theme.secondaryColor').optional().isHexColor(),
  body('features.voiceRecording').optional().isBoolean(),
  body('features.aiAnalysis').optional().isBoolean(),
  body('features.customQuestions').optional().isBoolean(),
  body('features.analytics').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { theme, features } = req.body;
    const updateData = {};

    if (theme) {
      updateData['settings.theme'] = { ...req.tenant.settings.theme, ...theme };
    }

    if (features) {
      updateData['settings.features'] = { ...req.tenant.settings.features, ...features };
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Tenant settings updated successfully',
      tenant: {
        id: updatedTenant._id,
        name: updatedTenant.name,
        settings: updatedTenant.settings,
        subscription: updatedTenant.subscription
      }
    });
  } catch (error) {
    console.error('Update tenant settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update tenant settings'
    });
  }
});

// Get tenant users
router.get('/users', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { tenantId: req.tenant._id };
    if (role) {
      filter.role = role;
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['admin', 'manager']), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['admin', 'manager', 'analyst', 'viewer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { email, password, firstName, lastName, role, permissions = [] } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      email,
      tenantId: req.tenant._id
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Check user limits
    const userCount = await User.countDocuments({ tenantId: req.tenant._id });
    if (userCount >= req.tenant.settings.limits.maxUsers) {
      return res.status(403).json({
        error: 'User limit exceeded',
        message: 'Maximum number of users reached for your plan'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      tenantId: req.tenant._id,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      permissions: permissions.length > 0 ? permissions : getDefaultPermissions(role)
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

// Update user
router.put('/users/:userId', authenticateToken, requireRole(['admin', 'manager']), [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('role').optional().isIn(['admin', 'manager', 'analyst', 'viewer']),
  body('permissions').optional().isArray(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { userId } = req.params;
    const { firstName, lastName, role, permissions, isActive } = req.body;

    const user = await User.findOne({
      _id: userId,
      tenantId: req.tenant._id
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) {
      updateData.role = role;
      updateData.permissions = permissions || getDefaultPermissions(role);
    }
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findOne({
      _id: userId,
      tenantId: req.tenant._id
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
});

// Helper function to get default permissions
function getDefaultPermissions(role) {
  const permissions = {
    admin: ['create_surveys', 'edit_surveys', 'delete_surveys', 'view_analytics', 'manage_users', 'manage_tenant'],
    manager: ['create_surveys', 'edit_surveys', 'view_analytics', 'manage_users'],
    analyst: ['view_analytics'],
    viewer: []
  };
  
  return permissions[role] || [];
}

module.exports = router;

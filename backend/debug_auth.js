const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

async function debugAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-culture-survey');
    
    // Get the tenant
    const tenant = await Tenant.findById('68f1f8a2baa5fceb5632c80c');
    console.log('Tenant found:', tenant);
    
    // Get the user
    const user = await User.findOne({
      _id: '68f1f8a72721e69bf070c1e8',
      tenantId: tenant._id,
      isActive: true
    });
    console.log('User found:', user);
    
    // Generate a token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      'your-super-secret-jwt-key-change-this-in-production', 
      { expiresIn: '24h' }
    );
    console.log('Generated token:', token);
    
    // Verify the token
    const decoded = jwt.verify(token, 'your-super-secret-jwt-key-change-this-in-production');
    console.log('Decoded token:', decoded);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAuth();

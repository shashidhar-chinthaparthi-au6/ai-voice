const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-culture-survey');
    
    // Test user lookup
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId('68f1f8a72721e69bf070c1e8'),
      isActive: true
    });
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User email:', user.email);
      console.log('User permissions:', user.permissions);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAuth();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

async function testFullAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-culture-survey');
    
    // Get tenant
    const tenant = await Tenant.findById('68f1f8a2baa5fceb5632c80c');
    console.log('Tenant found:', !!tenant);
    console.log('Tenant ID:', tenant._id);
    console.log('Tenant ID type:', typeof tenant._id);
    
    // Get user
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId('68f1f8a72721e69bf070c1e8'),
      tenantId: new mongoose.Types.ObjectId(tenant._id),
      isActive: true
    });
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User email:', user.email);
      console.log('User tenantId:', user.tenantId);
      console.log('User tenantId type:', typeof user.tenantId);
      console.log('Tenant match:', user.tenantId.toString() === tenant._id.toString());
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: '68f1f8a72721e69bf070c1e8', email: 'test@example.com' }, 
      'your-super-secret-jwt-key-change-this-in-production', 
      { expiresIn: '24h' }
    );
    console.log('Generated token:', token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFullAuth();

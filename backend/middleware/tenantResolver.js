const Tenant = require('../models/Tenant');

const resolveTenant = async (req, res, next) => {
  try {
    let tenant = null;
    
    // Method 1: Check for tenant header (for API calls)
    const tenantHeader = req.headers['x-tenant-id'];
    if (tenantHeader) {
      tenant = await Tenant.findById(tenantHeader);
    }
    
    // Method 2: Check subdomain
    if (!tenant && req.subdomains && req.subdomains.length > 0) {
      const subdomain = req.subdomains[0];
      tenant = await Tenant.findOne({ 
        subdomain: subdomain,
        isActive: true 
      });
    }
    
    // Method 3: Check domain
    if (!tenant) {
      const host = req.get('host');
      tenant = await Tenant.findOne({ 
        domain: host,
        isActive: true 
      });
    }
    
    // Method 4: Default tenant (for development)
    if (!tenant && process.env.NODE_ENV === 'development') {
      tenant = await Tenant.findOne({ 
        domain: 'localhost',
        isActive: true 
      });
      
      // Create default tenant if none exists
      if (!tenant) {
        tenant = new Tenant({
          name: 'Default Tenant',
          domain: 'localhost',
          subdomain: 'default'
        });
        await tenant.save();
      }
    }
    
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: 'The requested organization could not be found'
      });
    }
    
    // Check if tenant is active
    if (!tenant.isActive) {
      return res.status(403).json({ 
        error: 'Tenant inactive',
        message: 'This organization account has been suspended'
      });
    }
    
    // Check subscription status
    if (tenant.subscription.status !== 'active') {
      return res.status(403).json({ 
        error: 'Subscription inactive',
        message: 'This organization subscription is not active'
      });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to resolve tenant'
    });
  }
};

module.exports = resolveTenant;

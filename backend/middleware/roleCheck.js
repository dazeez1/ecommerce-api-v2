const User = require('../models/User');

/**
 * Middleware to check if user has admin role
 * Must be used after auth middleware
 */
const adminOnly = async (req, res, next) => {
  try {
    // Check if user is authenticated (from auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user from database to check current role
    const user = await User.findById(req.user._id).select('role');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        userRole: user.role
      });
    }

    // Add user info to request for admin routes
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role verification'
    });
  }
};

/**
 * Middleware to check if user has admin or customer role
 * Useful for routes that both admin and customer can access
 */
const adminOrCustomer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(req.user._id).select('role');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!['admin', 'customer'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or customer privileges required.',
        userRole: user.role
      });
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role verification'
    });
  }
};

module.exports = {
  adminOnly,
  adminOrCustomer
};

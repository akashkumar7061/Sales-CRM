const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes: verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_sales_crm_jwt_key_2026_secure');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact an administrator.`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required.',
    });
  }
};

// Approved users only
const approvedOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.status === 'approved')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Your account is pending administrator approval.',
    });
  }
};

module.exports = { protect, adminOnly, approvedOnly };

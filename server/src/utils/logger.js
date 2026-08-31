const ActivityLog = require('../models/ActivityLog');

const createLog = async ({ user, action, details, metadata = {} }) => {
  try {
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create activity log:', error.message);
  }
};

module.exports = { createLog };

const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs
// @route   GET /api/logs
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, action, startDate, endDate } = req.query;
    const query = {};

    // If employee, can only see own activities; Admin sees all
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs.',
    });
  }
};

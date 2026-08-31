const Notification = require('../models/Notification');
const Customer = require('../models/Customer');

// @desc    Get user notifications + dynamic follow-up checks
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check for today's due and overdue follow-ups and generate auto notifications if not already created
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Overdue query
    const overdueQuery = {
      followUpDate: { $lt: startOfToday },
      followUpStatus: { $nin: ['Converted', 'Lost'] },
    };
    if (userRole === 'employee') {
      overdueQuery.createdByEmployeeId = userId;
    }

    const overdueCount = await Customer.countDocuments(overdueQuery);

    // Due Today query
    const todayQuery = {
      followUpDate: { $gte: startOfToday, $lte: endOfToday },
      followUpStatus: { $nin: ['Converted', 'Lost'] },
    };
    if (userRole === 'employee') {
      todayQuery.createdByEmployeeId = userId;
    }

    const todayCount = await Customer.countDocuments(todayQuery);

    // Query notifications stored in DB
    const query = {
      $or: [
        { recipientId: userId },
        { recipientRole: userRole },
        { recipientRole: 'all' },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: unreadCount + (overdueCount > 0 ? 1 : 0) + (todayCount > 0 ? 1 : 0),
      alerts: {
        overdueFollowups: overdueCount,
        dueTodayFollowups: todayCount,
      },
      notifications,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        $or: [
          { recipientId: userId },
          { recipientRole: userRole },
          { recipientRole: 'all' },
        ],
        isRead: false,
      },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.', error: error.message });
  }
};

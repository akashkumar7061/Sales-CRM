const Customer = require('../models/Customer');
const User = require('../models/User');
const CallHistory = require('../models/CallHistory');
const Target = require('../models/Target');

// Helper for current month key
const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// @desc    Get Admin Dashboard Stats & Chart Data
// @route   GET /api/analytics/admin
// @access  Private (Admin only)
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // KPI Counts
    const totalCustomers = await Customer.countDocuments();
    const todayCustomers = await Customer.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({ role: 'employee', status: 'approved' });
    const pendingEmployees = await User.countDocuments({ role: 'employee', status: 'pending' });

    // Call stats
    const totalCalls = await CallHistory.countDocuments();
    const todayCalls = await CallHistory.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Overdue vs Due Today vs Upcoming
    const overdueFollowups = await Customer.countDocuments({
      followUpDate: { $lt: today },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    });
    const dueTodayFollowups = await Customer.countDocuments({
      followUpDate: { $gte: today, $lt: tomorrow },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    });
    const pendingFollowups = await Customer.countDocuments({
      followUpStatus: { $in: ['New Lead', 'Contacted', 'Interested', 'Follow-up', 'New', 'In Discussion', 'Quotation Sent', 'Follow-up Scheduled'] },
    });
    const completedFollowups = await Customer.countDocuments({
      followUpStatus: { $in: ['Converted', 'Won / Converted'] },
    });
    const lostFollowups = await Customer.countDocuments({
      followUpStatus: { $in: ['Lost', 'Not Interested', 'Lost / Dropped'] },
    });

    const conversionRate = totalCustomers > 0
      ? ((completedFollowups / totalCustomers) * 100).toFixed(1)
      : '0.0';

    // Priority breakdown
    const priorityDistribution = await Customer.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { priority: '$_id', count: 1, _id: 0 } },
    ]);

    // Chart 1: Customers by Location (Top 6 cities)
    const customersByLocation = await Customer.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { location: '$_id', count: 1, _id: 0 } },
    ]);

    // Chart 2: Leads by Source
    const leadsBySource = await Customer.aggregate([
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { source: '$_id', count: 1, _id: 0 } },
    ]);

    // Chart 3: Follow-up Status Distribution
    const statusDistribution = await Customer.aggregate([
      { $group: { _id: '$followUpStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Chart 4: Customer records & performance by Employee
    const customersByEmployee = await Customer.aggregate([
      {
        $group: {
          _id: '$salesEmployeeName',
          total: { $sum: 1 },
          won: {
            $sum: {
              $cond: [{ $in: ['$followUpStatus', ['Converted', 'Won / Converted']] }, 1, 0],
            },
          },
          lost: {
            $sum: {
              $cond: [{ $in: ['$followUpStatus', ['Lost', 'Not Interested', 'Lost / Dropped']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
      { $project: { employee: '$_id', total: 1, won: 1, lost: 1, _id: 0 } },
    ]);

    // Monthly Growth (Past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrends = await Customer.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = monthlyTrends.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      customers: item.count,
    }));

    // Recent Customer Entries
    const recentCustomers = await Customer.find()
      .populate('createdByEmployeeId', 'name email avatarColor')
      .sort({ createdAt: -1 })
      .limit(7);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        todayCustomers,
        totalEmployees,
        activeEmployees,
        pendingEmployees,
        pendingFollowups,
        overdueFollowups,
        dueTodayFollowups,
        completedFollowups,
        lostFollowups,
        totalCalls,
        todayCalls,
        conversionRate,
      },
      charts: {
        customersByLocation,
        leadsBySource,
        statusDistribution,
        priorityDistribution,
        customersByEmployee,
        monthlyTrends: formattedTrends,
      },
      recentCustomers,
    });
  } catch (error) {
    console.error('getAdminDashboardStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard analytics.',
    });
  }
};

// @desc    Get Employee Dashboard Stats
// @route   GET /api/analytics/employee
// @access  Private (Approved employee)
exports.getEmployeeDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const myTotalCustomers = await Customer.countDocuments({ createdByEmployeeId: userId });
    const myTodayCustomers = await Customer.countDocuments({
      createdByEmployeeId: userId,
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const myPendingFollowups = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpStatus: { $in: ['New Lead', 'Contacted', 'Interested', 'Follow-up', 'New', 'In Discussion', 'Quotation Sent', 'Follow-up Scheduled'] },
    });
    const myTodayScheduledFollowups = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpDate: { $gte: today, $lt: tomorrow },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    });
    const myOverdueFollowups = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpDate: { $lt: today },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    });
    const myCompletedFollowups = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpStatus: { $in: ['Converted', 'Won / Converted'] },
    });

    const myCallsCount = await CallHistory.countDocuments({ userId });
    const myTodayCallsCount = await CallHistory.countDocuments({
      userId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const myConversionRate = myTotalCustomers > 0
      ? ((myCompletedFollowups / myTotalCustomers) * 100).toFixed(1)
      : '0.0';

    // Status breakdown
    const myStatusDistribution = await Customer.aggregate([
      { $match: { createdByEmployeeId: userId } },
      { $group: { _id: '$followUpStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Priority breakdown
    const myPriorityDistribution = await Customer.aggregate([
      { $match: { createdByEmployeeId: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { priority: '$_id', count: 1, _id: 0 } },
    ]);

    // Lead source breakdown
    const myLeadSources = await Customer.aggregate([
      { $match: { createdByEmployeeId: userId } },
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { source: '$_id', count: 1, _id: 0 } },
    ]);

    // Target summary
    const currentMonth = getCurrentMonthKey();
    const myTargetDoc = await Target.findOne({ userId, month: currentMonth });
    const monthlyTarget = myTargetDoc ? myTargetDoc.monthlyLeadTarget : 100;
    const conversionTarget = myTargetDoc ? myTargetDoc.monthlyConversionTarget : 20;

    // Upcoming followups
    const upcomingFollowups = await Customer.find({
      createdByEmployeeId: userId,
      followUpDate: { $gte: today },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    })
      .sort({ followUpDate: 1 })
      .limit(6);

    // Overdue followups list
    const overdueFollowupList = await Customer.find({
      createdByEmployeeId: userId,
      followUpDate: { $lt: today },
      followUpStatus: { $nin: ['Converted', 'Lost', 'Won / Converted', 'Lost / Dropped'] },
    })
      .sort({ followUpDate: 1 })
      .limit(5);

    // Recent 5 entries
    const myRecentCustomers = await Customer.find({ createdByEmployeeId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        myTotalCustomers,
        myTodayCustomers,
        myPendingFollowups,
        myTodayScheduledFollowups,
        myOverdueFollowups,
        myCompletedFollowups,
        myCallsCount,
        myTodayCallsCount,
        myConversionRate,
        monthlyTarget,
        conversionTarget,
      },
      charts: {
        myStatusDistribution,
        myPriorityDistribution,
        myLeadSources,
      },
      upcomingFollowups,
      overdueFollowupList,
      myRecentCustomers,
    });
  } catch (error) {
    console.error('getEmployeeDashboardStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee dashboard analytics.',
    });
  }
};

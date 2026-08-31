const Target = require('../models/Target');
const Customer = require('../models/Customer');
const CallHistory = require('../models/CallHistory');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Helper to get current month YYYY-MM
const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// @desc    Get employee's active targets with achieved metrics
// @route   GET /api/targets/my-target
// @access  Private (Employee)
exports.getMyTarget = async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonthKey();
    const userId = req.user._id;

    let target = await Target.findOne({ userId, month });
    if (!target) {
      target = {
        userId,
        employeeName: req.user.name,
        month,
        dailyLeadTarget: 5,
        monthlyLeadTarget: 100,
        dailyCallTarget: 25,
        monthlyCallTarget: 500,
        dailyConversionTarget: 1,
        monthlyConversionTarget: 20,
      };
    }

    // Compute achievements for the month
    const [yearStr, monthStr] = month.split('-');
    const startOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    const endOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0, 23, 59, 59, 999);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Monthly leads added
    const achievedMonthlyLeads = await Customer.countDocuments({
      createdByEmployeeId: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Today leads added
    const achievedDailyLeads = await Customer.countDocuments({
      createdByEmployeeId: userId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // Monthly calls completed
    const achievedMonthlyCalls = await CallHistory.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Today calls completed
    const achievedDailyCalls = await CallHistory.countDocuments({
      userId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // Monthly conversions (Converted / Won)
    const achievedMonthlyConversions = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpStatus: { $in: ['Converted', 'Won / Converted'] },
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Today conversions
    const achievedDailyConversions = await Customer.countDocuments({
      createdByEmployeeId: userId,
      followUpStatus: { $in: ['Converted', 'Won / Converted'] },
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    });

    res.status(200).json({
      success: true,
      target,
      progress: {
        dailyLeads: {
          assigned: target.dailyLeadTarget,
          achieved: achievedDailyLeads,
          remaining: Math.max(0, target.dailyLeadTarget - achievedDailyLeads),
          percentage: target.dailyLeadTarget > 0 ? Math.min(100, Math.round((achievedDailyLeads / target.dailyLeadTarget) * 100)) : 100,
        },
        monthlyLeads: {
          assigned: target.monthlyLeadTarget,
          achieved: achievedMonthlyLeads,
          remaining: Math.max(0, target.monthlyLeadTarget - achievedMonthlyLeads),
          percentage: target.monthlyLeadTarget > 0 ? Math.min(100, Math.round((achievedMonthlyLeads / target.monthlyLeadTarget) * 100)) : 100,
        },
        dailyCalls: {
          assigned: target.dailyCallTarget,
          achieved: achievedDailyCalls,
          remaining: Math.max(0, target.dailyCallTarget - achievedDailyCalls),
          percentage: target.dailyCallTarget > 0 ? Math.min(100, Math.round((achievedDailyCalls / target.dailyCallTarget) * 100)) : 100,
        },
        monthlyCalls: {
          assigned: target.monthlyCallTarget || 500,
          achieved: achievedMonthlyCalls,
          remaining: Math.max(0, (target.monthlyCallTarget || 500) - achievedMonthlyCalls),
          percentage: (target.monthlyCallTarget || 500) > 0 ? Math.min(100, Math.round((achievedMonthlyCalls / (target.monthlyCallTarget || 500)) * 100)) : 100,
        },
        dailyConversions: {
          assigned: target.dailyConversionTarget || 1,
          achieved: achievedDailyConversions,
          remaining: Math.max(0, (target.dailyConversionTarget || 1) - achievedDailyConversions),
          percentage: (target.dailyConversionTarget || 1) > 0 ? Math.min(100, Math.round((achievedDailyConversions / (target.dailyConversionTarget || 1)) * 100)) : 100,
        },
        monthlyConversions: {
          assigned: target.monthlyConversionTarget,
          achieved: achievedMonthlyConversions,
          remaining: Math.max(0, target.monthlyConversionTarget - achievedMonthlyConversions),
          percentage: target.monthlyConversionTarget > 0 ? Math.min(100, Math.round((achievedMonthlyConversions / target.monthlyConversionTarget) * 100)) : 100,
        },
      },
    });
  } catch (error) {
    console.error('Get My Target Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve target metrics.', error: error.message });
  }
};

// @desc    Get all employee targets and progress leaderboard (Admin)
// @route   GET /api/targets/all
// @access  Private (Admin)
exports.getAllTargets = async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonthKey();
    const employees = await User.find({ role: 'employee', status: 'approved' }).select('name email phone designation avatarColor');

    const [yearStr, monthStr] = month.split('-');
    const startOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    const endOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0, 23, 59, 59, 999);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const targets = await Target.find({ month });
    const targetMap = new Map();
    targets.forEach((t) => targetMap.set(t.userId.toString(), t));

    const results = await Promise.all(
      employees.map(async (emp) => {
        const target = targetMap.get(emp._id.toString()) || {
          userId: emp._id,
          employeeName: emp.name,
          month,
          dailyLeadTarget: 5,
          monthlyLeadTarget: 100,
          dailyCallTarget: 25,
          monthlyCallTarget: 500,
          dailyConversionTarget: 1,
          monthlyConversionTarget: 20,
          notes: '',
        };

        const achievedMonthlyLeads = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const achievedDailyLeads = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        });

        const achievedMonthlyCalls = await CallHistory.countDocuments({
          userId: emp._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const achievedDailyCalls = await CallHistory.countDocuments({
          userId: emp._id,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        });

        const achievedMonthlyConversions = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          followUpStatus: { $in: ['Converted', 'Won / Converted'] },
          updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const achievedDailyConversions = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          followUpStatus: { $in: ['Converted', 'Won / Converted'] },
          updatedAt: { $gte: startOfToday, $lte: endOfToday },
        });

        const monthlyLeadPct = target.monthlyLeadTarget > 0 ? Math.min(100, Math.round((achievedMonthlyLeads / target.monthlyLeadTarget) * 100)) : 100;
        const monthlyCallPct = (target.monthlyCallTarget || 500) > 0 ? Math.min(100, Math.round((achievedMonthlyCalls / (target.monthlyCallTarget || 500)) * 100)) : 100;
        const monthlyConvPct = target.monthlyConversionTarget > 0 ? Math.min(100, Math.round((achievedMonthlyConversions / target.monthlyConversionTarget) * 100)) : 100;

        // Overall performance score
        const overallScore = Math.round((monthlyLeadPct + monthlyCallPct + monthlyConvPct) / 3);

        return {
          employee: emp,
          target,
          overallScore,
          progress: {
            monthlyLeads: {
              target: target.monthlyLeadTarget,
              achieved: achievedMonthlyLeads,
              remaining: Math.max(0, target.monthlyLeadTarget - achievedMonthlyLeads),
              percentage: monthlyLeadPct,
            },
            monthlyCalls: {
              target: target.monthlyCallTarget || 500,
              achieved: achievedMonthlyCalls,
              remaining: Math.max(0, (target.monthlyCallTarget || 500) - achievedMonthlyCalls),
              percentage: monthlyCallPct,
            },
            monthlyConversions: {
              target: target.monthlyConversionTarget,
              achieved: achievedMonthlyConversions,
              remaining: Math.max(0, target.monthlyConversionTarget - achievedMonthlyConversions),
              percentage: monthlyConvPct,
            },
            dailyLeads: {
              target: target.dailyLeadTarget,
              achieved: achievedDailyLeads,
            },
            dailyCalls: {
              target: target.dailyCallTarget,
              achieved: achievedDailyCalls,
            },
            dailyConversions: {
              target: target.dailyConversionTarget || 1,
              achieved: achievedDailyConversions,
            },
          },
        };
      })
    );

    // Sort by overall performance score descending
    results.sort((a, b) => b.overallScore - a.overallScore);

    res.status(200).json({
      success: true,
      month,
      count: results.length,
      targets: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve team targets.', error: error.message });
  }
};

// @desc    Assign or update targets for an employee (Admin only)
// @route   POST /api/targets
// @access  Private (Admin)
exports.saveTarget = async (req, res) => {
  try {
    const {
      userId,
      month = getCurrentMonthKey(),
      dailyLeadTarget,
      monthlyLeadTarget,
      dailyCallTarget,
      monthlyCallTarget,
      dailyConversionTarget,
      monthlyConversionTarget,
      notes,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const target = await Target.findOneAndUpdate(
      { userId, month },
      {
        userId,
        employeeName: user.name,
        month,
        dailyLeadTarget: Number(dailyLeadTarget) || 5,
        monthlyLeadTarget: Number(monthlyLeadTarget) || 100,
        dailyCallTarget: Number(dailyCallTarget) || 25,
        monthlyCallTarget: Number(monthlyCallTarget) || 500,
        dailyConversionTarget: Number(dailyConversionTarget) || 1,
        monthlyConversionTarget: Number(monthlyConversionTarget) || 20,
        assignedBy: req.user._id,
        assignedByName: req.user.name,
        notes: notes || '',
      },
      { upsert: true, new: true }
    );

    // Notify employee with specific quotas
    await Notification.create({
      recipientId: user._id,
      recipientRole: 'employee',
      title: '🎯 Sales Targets Assigned by Admin',
      message: `Admin has assigned your targets for ${month}: ${target.monthlyLeadTarget} Leads, ${target.monthlyCallTarget} Calls, ${target.monthlyConversionTarget} Conversions.`,
      type: 'target',
      link: '/employee/dashboard',
    });

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ASSIGN_TARGET',
      targetId: user._id,
      targetModel: 'User',
      details: `Assigned sales quotas to ${user.name} for ${month}: Leads (${target.monthlyLeadTarget}), Calls (${target.monthlyCallTarget}), Conversions (${target.monthlyConversionTarget})`,
    });

    res.status(200).json({
      success: true,
      message: `Targets for ${user.name} have been assigned successfully.`,
      target,
    });
  } catch (error) {
    console.error('Save Target Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign targets.', error: error.message });
  }
};

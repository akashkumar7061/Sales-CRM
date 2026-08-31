const DailyReport = require('../models/DailyReport');
const Customer = require('../models/Customer');
const CallHistory = require('../models/CallHistory');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Submit / update employee daily work report and attendance
// @route   POST /api/reports/submit
// @access  Private (Employee)
exports.submitDailyReport = async (req, res) => {
  try {
    const {
      date = new Date(),
      attendanceStatus = 'Present',
      clockInTime,
      clockOutTime,
      customersContacted,
      followupsCompleted,
      newLeadsAdded,
      dealsConverted,
      remarks,
    } = req.body;

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const startOfReportDay = new Date(reportDate);
    const endOfReportDay = new Date(reportDate);
    endOfReportDay.setHours(23, 59, 59, 999);

    // Auto-calculate counts if not explicitly supplied
    const autoNewLeads = await Customer.countDocuments({
      createdByEmployeeId: req.user._id,
      createdAt: { $gte: startOfReportDay, $lte: endOfReportDay },
    });

    const autoCalls = await CallHistory.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startOfReportDay, $lte: endOfReportDay },
    });

    const autoConversions = await Customer.countDocuments({
      createdByEmployeeId: req.user._id,
      followUpStatus: 'Converted',
      updatedAt: { $gte: startOfReportDay, $lte: endOfReportDay },
    });

    const report = await DailyReport.findOneAndUpdate(
      {
        userId: req.user._id,
        date: { $gte: startOfReportDay, $lte: endOfReportDay },
      },
      {
        userId: req.user._id,
        employeeName: req.user.name,
        date: reportDate,
        attendanceStatus,
        clockInTime: clockInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOutTime: clockOutTime || '',
        customersContacted: customersContacted !== undefined ? Number(customersContacted) : autoCalls,
        followupsCompleted: followupsCompleted !== undefined ? Number(followupsCompleted) : autoCalls,
        newLeadsAdded: newLeadsAdded !== undefined ? Number(newLeadsAdded) : autoNewLeads,
        dealsConverted: dealsConverted !== undefined ? Number(dealsConverted) : autoConversions,
        remarks: remarks || '',
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SUBMIT_DAILY_REPORT',
      targetId: report._id,
      targetModel: 'DailyReport',
      details: `Submitted daily work report for ${reportDate.toLocaleDateString()} (${attendanceStatus}, ${report.newLeadsAdded} leads, ${report.customersContacted} calls)`,
    });

    res.status(200).json({
      success: true,
      message: 'Daily work report submitted successfully.',
      report,
    });
  } catch (error) {
    console.error('Submit Daily Report Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit daily report.', error: error.message });
  }
};

// @desc    Get employee's own daily reports
// @route   GET /api/reports/my-reports
// @access  Private (Employee)
exports.getMyDailyReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (req.query.date) {
      const singleDate = new Date(req.query.date);
      singleDate.setHours(0, 0, 0, 0);
      const endSingle = new Date(singleDate);
      endSingle.setHours(23, 59, 59, 999);
      query.date = { $gte: singleDate, $lte: endSingle };
    }

    const total = await DailyReport.countDocuments(query);
    const reports = await DailyReport.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch personal reports.', error: error.message });
  }
};

// @desc    Get all daily reports for team (Admin)
// @route   GET /api/reports/all
// @access  Private (Admin)
exports.getAllDailyReports = async (req, res) => {
  try {
    const query = {};

    if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.userId = req.query.employeeId;
    }

    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (req.query.date) {
      const singleDate = new Date(req.query.date);
      singleDate.setHours(0, 0, 0, 0);
      const endSingle = new Date(singleDate);
      endSingle.setHours(23, 59, 59, 999);
      query.date = { $gte: singleDate, $lte: endSingle };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await DailyReport.countDocuments(query);
    const reports = await DailyReport.find(query)
      .populate('userId', 'name email designation avatarColor')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch team daily reports.', error: error.message });
  }
};

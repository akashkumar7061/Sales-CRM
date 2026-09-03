const DailyReport = require('../models/DailyReport');
const Customer = require('../models/Customer');
const CallHistory = require('../models/CallHistory');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// Helper to safely parse numbers with default fallback
const safeNumber = (val, defaultVal = 0) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : Math.max(0, num);
};

// @desc    Submit / update employee daily work report and attendance
// @route   POST /api/reports/submit
// @access  Private (Employee / Admin)
exports.submitDailyReport = async (req, res) => {
  try {
    const {
      date,
      attendanceStatus = 'Present',
      clockInTime,
      clockOutTime,
      customersContacted,
      followupsCompleted,
      newLeadsAdded,
      dealsConverted,
      remarks,
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    const reportDate = new Date(parsedDate);
    reportDate.setHours(0, 0, 0, 0);

    const startOfReportDay = new Date(reportDate);
    startOfReportDay.setHours(0, 0, 0, 0);

    const endOfReportDay = new Date(reportDate);
    endOfReportDay.setHours(23, 59, 59, 999);

    // Auto-calculate counts from CRM for that day
    let autoNewLeads = 0;
    let autoCalls = 0;
    let autoConversions = 0;

    try {
      autoNewLeads = await Customer.countDocuments({
        createdByEmployeeId: req.user._id,
        createdAt: { $gte: startOfReportDay, $lte: endOfReportDay },
      });

      autoCalls = await CallHistory.countDocuments({
        userId: req.user._id,
        createdAt: { $gte: startOfReportDay, $lte: endOfReportDay },
      });

      autoConversions = await Customer.countDocuments({
        createdByEmployeeId: req.user._id,
        followUpStatus: 'Converted',
        updatedAt: { $gte: startOfReportDay, $lte: endOfReportDay },
      });
    } catch (e) {
      console.warn('Auto calculation warning:', e);
    }

    const employeeName = req.user.name || 'Sales Representative';
    const finalClockIn = clockInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if report already exists for this day
    let report = await DailyReport.findOne({
      userId: req.user._id,
      date: { $gte: startOfReportDay, $lte: endOfReportDay },
    });

    if (report) {
      // Update existing report
      report.employeeName = employeeName;
      report.attendanceStatus = attendanceStatus || 'Present';
      if (clockInTime) report.clockInTime = clockInTime;
      if (clockOutTime !== undefined) report.clockOutTime = clockOutTime;
      report.customersContacted = safeNumber(customersContacted, autoCalls);
      report.followupsCompleted = safeNumber(followupsCompleted, autoCalls);
      report.newLeadsAdded = safeNumber(newLeadsAdded, autoNewLeads);
      report.dealsConverted = safeNumber(dealsConverted, autoConversions);
      if (remarks !== undefined) report.remarks = remarks;
      report.submittedAt = new Date();
      await report.save();
    } else {
      // Create new report
      report = await DailyReport.create({
        userId: req.user._id,
        employeeName,
        date: reportDate,
        attendanceStatus: attendanceStatus || 'Present',
        clockInTime: finalClockIn,
        clockOutTime: clockOutTime || '',
        customersContacted: safeNumber(customersContacted, autoCalls),
        followupsCompleted: safeNumber(followupsCompleted, autoCalls),
        newLeadsAdded: safeNumber(newLeadsAdded, autoNewLeads),
        dealsConverted: safeNumber(dealsConverted, autoConversions),
        remarks: remarks || '',
        submittedAt: new Date(),
      });
    }

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'User',
        userRole: req.user.role || 'employee',
        action: 'SUBMIT_DAILY_REPORT',
        targetId: report._id,
        targetModel: 'DailyReport',
        details: `Submitted daily work report for ${reportDate.toLocaleDateString()} (${attendanceStatus}, ${report.newLeadsAdded} leads, ${report.customersContacted} calls)`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Daily work report submitted successfully!',
      report,
    });
  } catch (error) {
    console.error('Submit Daily Report Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit daily report. Please check input fields.',
    });
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

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
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

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    } else if (req.query.date) {
      const singleDate = new Date(req.query.date);
      singleDate.setHours(0, 0, 0, 0);
      const endSingle = new Date(singleDate);
      endSingle.setHours(23, 59, 59, 999);
      query.date = { $gte: singleDate, $lte: endSingle };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const total = await DailyReport.countDocuments(query);
    const reports = await DailyReport.find(query)
      .populate('userId', 'name email designation phone avatarColor')
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

// @desc    Delete a daily work report
// @route   DELETE /api/reports/:id
// @access  Private (Admin only)
exports.deleteDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily work report not found.' });
    }

    await DailyReport.findByIdAndDelete(req.params.id);

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'DELETE_DAILY_REPORT',
        targetId: req.params.id,
        targetModel: 'DailyReport',
        details: `Deleted daily work report of ${report.employeeName} for date ${new Date(report.date).toLocaleDateString()}.`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Daily work report deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Daily Report Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete daily report.', error: error.message });
  }
};

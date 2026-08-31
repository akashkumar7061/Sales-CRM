const CallHistory = require('../models/CallHistory');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Log a phone call interaction for a customer
// @route   POST /api/calls/:customerId
// @access  Private (Assigned Employee or Admin)
exports.logCall = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      callDate,
      callTime,
      callResult,
      nextAction,
      remarks,
      newStatus,
      newFollowUpDate,
      newFollowUpTime,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    // Role check: Employee can only log calls for their assigned leads
    if (req.user.role === 'employee' && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only record calls for your own customer leads.',
      });
    }

    if (!remarks || !callResult) {
      return res.status(400).json({
        success: false,
        message: 'Please provide call result and notes/remarks.',
      });
    }

    // Create call record
    const callLog = await CallHistory.create({
      customerId: customer._id,
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      userId: req.user._id,
      salesEmployeeName: req.user.name,
      callDate: callDate || new Date(),
      callTime: callTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      callResult,
      nextAction: nextAction || '',
      remarks,
      newStatus: newStatus || customer.followUpStatus,
      newFollowUpDate: newFollowUpDate || customer.followUpDate,
      newFollowUpTime: newFollowUpTime || customer.followUpTime,
    });

    // Update customer status and follow-up if specified
    const updates = { lastUpdatedBy: req.user._id };
    let statusChanged = false;
    let oldStatus = customer.followUpStatus;

    if (newStatus && newStatus !== customer.followUpStatus) {
      updates.followUpStatus = newStatus;
      statusChanged = true;
    }

    if (newFollowUpDate) {
      updates.followUpDate = new Date(newFollowUpDate);
    }
    if (newFollowUpTime) {
      updates.followUpTime = newFollowUpTime;
    }

    // Append to customer timeline
    const timelineEntry = {
      action: 'CALL_LOGGED',
      description: `Call recorded (${callResult}): ${remarks.substring(0, 100)}${remarks.length > 100 ? '...' : ''}`,
      performedBy: req.user._id,
      performerName: req.user.name,
      timestamp: new Date(),
      metadata: { callResult, nextAction, newStatus },
    };

    customer.timeline.push(timelineEntry);

    if (statusChanged) {
      customer.timeline.push({
        action: 'STATUS_CHANGE',
        description: `Status updated from "${oldStatus}" to "${newStatus}" after call`,
        performedBy: req.user._id,
        performerName: req.user.name,
        timestamp: new Date(),
      });
    }

    Object.assign(customer, updates);
    await customer.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'LOG_CALL',
      targetId: customer._id,
      targetModel: 'Customer',
      details: `Logged call with "${customer.customerName}" (${callResult}). Notes: "${remarks.substring(0, 60)}"`,
    });

    res.status(201).json({
      success: true,
      message: 'Call history successfully logged.',
      callLog,
      customer,
    });
  } catch (error) {
    console.error('Log Call Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving call record.', error: error.message });
  }
};

// @desc    Get call history for a customer
// @route   GET /api/calls/:customerId
// @access  Private
exports.getCustomerCalls = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    if (req.user.role === 'employee' && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const calls = await CallHistory.find({ customerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch call history.', error: error.message });
  }
};

// @desc    Get all call logs across company (Admin or Employee own)
// @route   GET /api/calls
// @access  Private
exports.getAllCalls = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.userId = req.query.employeeId;
    }

    if (req.query.callResult && req.query.callResult !== 'all') {
      query.callResult = req.query.callResult;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await CallHistory.countDocuments(query);
    const calls = await CallHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      calls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve call logs.', error: error.message });
  }
};

const CallHistory = require('../models/CallHistory');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @desc    Log a phone call interaction for a customer (with optional audio recording)
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
      recordingDuration,
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

    // Recording audio data if attached
    let recordingUrl = '';
    let recordingFileName = '';
    let recordingFileSize = 0;
    let recordingMimeType = '';
    let hasRecording = false;

    if (req.file) {
      recordingUrl = `/uploads/recordings/${req.file.filename}`;
      recordingFileName = req.file.originalname;
      recordingFileSize = req.file.size;
      recordingMimeType = req.file.mimetype;
      hasRecording = true;
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
      recordingUrl,
      recordingFileName,
      recordingFileSize,
      recordingMimeType,
      recordingDuration: recordingDuration || '',
      hasRecording,
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
      description: `Call recorded (${callResult})${hasRecording ? ' 🎙️ [Audio Attached]' : ''}: ${remarks.substring(0, 100)}${remarks.length > 100 ? '...' : ''}`,
      performedBy: req.user._id,
      performerName: req.user.name,
      timestamp: new Date(),
      metadata: { callResult, nextAction, newStatus, hasRecording, recordingUrl },
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
      details: `Logged call with "${customer.customerName}" (${callResult})${hasRecording ? ' with Audio Recording' : ''}. Notes: "${remarks.substring(0, 60)}"`,
    });

    // Notify Admin if employee uploaded a call recording
    if (hasRecording && req.user.role === 'employee') {
      await Notification.create({
        title: '🎙️ New Call Recording Uploaded',
        message: `${req.user.name} uploaded a call recording for customer ${customer.customerName} (${customer.mobileNumber}).`,
        type: 'info',
        recipientRole: 'admin',
        customerId: customer._id,
      });
    }

    res.status(201).json({
      success: true,
      message: `Call history${hasRecording ? ' and Audio Recording' : ''} successfully logged.`,
      callLog,
      customer,
    });
  } catch (error) {
    console.error('Log Call Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving call record.', error: error.message });
  }
};

// @desc    Direct upload call recording for a selected customer
// @route   POST /api/calls/upload-recording
// @access  Private
exports.uploadRecording = async (req, res) => {
  try {
    const {
      customerId,
      callDate,
      callTime,
      callResult,
      remarks,
      recordingDuration,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an audio file to upload.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    if (req.user.role === 'employee' && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only upload recordings for your own customers.',
      });
    }

    const recordingUrl = `/uploads/recordings/${req.file.filename}`;
    const recordingFileName = req.file.originalname;
    const recordingFileSize = req.file.size;
    const recordingMimeType = req.file.mimetype;

    const callLog = await CallHistory.create({
      customerId: customer._id,
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      userId: req.user._id,
      salesEmployeeName: req.user.name,
      callDate: callDate || new Date(),
      callTime: callTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      callResult: callResult || 'Connected',
      remarks: remarks || `Call recording uploaded on ${new Date().toLocaleDateString()}`,
      newStatus: customer.followUpStatus,
      newFollowUpDate: customer.followUpDate,
      newFollowUpTime: customer.followUpTime,
      recordingUrl,
      recordingFileName,
      recordingFileSize,
      recordingMimeType,
      recordingDuration: recordingDuration || '',
      hasRecording: true,
    });

    // Append to customer timeline
    customer.timeline.push({
      action: 'CALL_LOGGED',
      description: `🎙️ Call Recording Uploaded by ${req.user.name}: "${remarks || 'Customer discussion'}"`,
      performedBy: req.user._id,
      performerName: req.user.name,
      timestamp: new Date(),
      metadata: { callResult: callResult || 'Connected', hasRecording: true, recordingUrl },
    });
    customer.lastUpdatedBy = req.user._id;
    await customer.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPLOAD_RECORDING',
      targetId: customer._id,
      targetModel: 'Customer',
      details: `Uploaded call recording (${recordingFileName}) for customer "${customer.customerName}".`,
    });

    // Notify Admin
    if (req.user.role === 'employee') {
      await Notification.create({
        title: '🎙️ New Call Recording Uploaded',
        message: `${req.user.name} uploaded a call recording for customer ${customer.customerName} (${customer.mobileNumber}).`,
        type: 'info',
        recipientRole: 'admin',
        customerId: customer._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Call recording uploaded successfully!',
      callLog,
    });
  } catch (error) {
    console.error('Upload Recording Error:', error);
    res.status(500).json({ success: false, message: 'Server error while uploading recording.', error: error.message });
  }
};

// @desc    Get all call recordings (with interactive playback & admin filters)
// @route   GET /api/calls/recordings
// @access  Private (Admin sees all, Employee sees own)
exports.getRecordings = async (req, res) => {
  try {
    const query = { hasRecording: true };

    // Role check
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.userId = req.query.employeeId;
    }

    // Call result filter
    if (req.query.callResult && req.query.callResult !== 'all') {
      query.callResult = req.query.callResult;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.callDate = {};
      if (req.query.startDate) query.callDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.callDate.$lte = end;
      }
    }

    // Search by Customer Name, Mobile, Employee, or Remarks
    if (req.query.search && req.query.search.trim() !== '') {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { mobileNumber: searchRegex },
        { salesEmployeeName: searchRegex },
        { remarks: searchRegex },
      ];
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await CallHistory.countDocuments(query);
    const recordings = await CallHistory.find(query)
      .populate('customerId', 'customerName mobileNumber companyName followUpStatus priority city')
      .sort({ callDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Summary statistics for dashboard cards
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const baseStatQuery = req.user.role === 'employee' ? { userId: req.user._id, hasRecording: true } : { hasRecording: true };
    const totalRecordings = await CallHistory.countDocuments(baseStatQuery);
    const todayRecordings = await CallHistory.countDocuments({
      ...baseStatQuery,
      callDate: { $gte: startOfToday },
    });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        totalRecordings,
        todayRecordings,
      },
      recordings,
    });
  } catch (error) {
    console.error('Get Recordings Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve call recordings.', error: error.message });
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

// @desc    Delete a call recording
// @route   DELETE /api/calls/recordings/:id
// @access  Private (Admin only or Owner)
exports.deleteRecording = async (req, res) => {
  try {
    const callLog = await CallHistory.findById(req.params.id);
    if (!callLog) {
      return res.status(404).json({ success: false, message: 'Call recording not found.' });
    }

    if (req.user.role !== 'admin' && callLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own recordings.' });
    }

    // Try deleting physical file from disk
    if (callLog.recordingUrl) {
      try {
        const filePath = path.join(__dirname, '../..', callLog.recordingUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to unlink audio file:', err);
      }
    }

    await CallHistory.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_RECORDING',
      targetId: callLog.customerId,
      targetModel: 'Customer',
      details: `Deleted call recording with "${callLog.customerName}" (${callLog.recordingFileName || 'audio'}).`,
    });

    res.status(200).json({
      success: true,
      message: 'Call recording deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Recording Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete recording.', error: error.message });
  }
};

const CallHistory = require('../models/CallHistory');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');
const { saveFileToGridFS, deleteFileFromGridFS, streamFileFromGridFS } = require('../utils/gridfsStorage');

// Safe date parser helper
const parseSafeDate = (d, fallback = null) => {
  if (!d) return fallback;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

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

    // Recording audio data if attached
    let recordingUrl = '';
    let recordingFileName = '';
    let recordingFileSize = 0;
    let recordingMimeType = '';
    let hasRecording = false;
    let gridFsFileId = null;

    if (req.file) {
      recordingUrl = `/uploads/recordings/${req.file.filename}`;
      recordingFileName = req.file.originalname;
      recordingFileSize = req.file.size;
      recordingMimeType = req.file.mimetype;
      hasRecording = true;

      // Permanent MongoDB cloud storage backup
      try {
        gridFsFileId = await saveFileToGridFS(req.file.path, req.file.filename, {
          customerId: customer._id,
          customerName: customer.customerName,
          mobileNumber: customer.mobileNumber,
          uploadedBy: req.user._id,
          originalName: req.file.originalname,
        });
      } catch (gridErr) {
        console.warn('GridFS backup warning:', gridErr);
      }
    }

    const safeCallDate = parseSafeDate(callDate, new Date());
    const safeFollowUpDate = parseSafeDate(newFollowUpDate, customer.followUpDate);

    // Create call record
    const callLog = await CallHistory.create({
      customerId: customer._id,
      customerName: customer.customerName || 'Customer',
      mobileNumber: customer.mobileNumber || '',
      companyName: customer.companyName || 'SofaShine',
      userId: req.user._id,
      salesEmployeeName: req.user.name || 'Sales Executive',
      callDate: safeCallDate,
      callTime: callTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      callResult: callResult || 'Connected',
      nextAction: nextAction || '',
      remarks: remarks || 'Call interaction logged',
      newStatus: newStatus || customer.followUpStatus,
      newFollowUpDate: safeFollowUpDate,
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

    if (safeFollowUpDate) {
      updates.followUpDate = safeFollowUpDate;
    }
    if (newFollowUpTime) {
      updates.followUpTime = newFollowUpTime;
    }

    // Append to customer timeline
    if (!customer.timeline) customer.timeline = [];
    const timelineEntry = {
      action: 'CALL_LOGGED',
      description: `Call recorded (${callResult || 'Connected'})${hasRecording ? ' 🎙️ [Audio Attached]' : ''}: ${(remarks || '').substring(0, 100)}`,
      performedBy: req.user._id,
      performerName: req.user.name || 'User',
      timestamp: new Date(),
      metadata: { callResult: callResult || 'Connected', nextAction, newStatus, hasRecording, recordingUrl },
    };

    customer.timeline.push(timelineEntry);

    if (statusChanged) {
      customer.timeline.push({
        action: 'STATUS_CHANGE',
        description: `Status updated from "${oldStatus}" to "${newStatus}" after call`,
        performedBy: req.user._id,
        performerName: req.user.name || 'User',
        timestamp: new Date(),
      });
    }

    Object.assign(customer, updates);
    await customer.save();

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'User',
        userRole: req.user.role || 'employee',
        action: 'LOG_CALL',
        targetId: customer._id,
        targetModel: 'Customer',
        details: `Logged call with "${customer.customerName}" (${callResult || 'Connected'})${hasRecording ? ' with Audio Recording' : ''}.`,
      });
    } catch (e) {
      console.warn('ActivityLog warning:', e);
    }

    // Notify Admin if employee uploaded a call recording
    if (hasRecording && req.user.role === 'employee') {
      try {
        await Notification.create({
          title: '🎙️ New Call Recording Uploaded',
          message: `${req.user.name} uploaded a call recording for customer ${customer.customerName} (${customer.mobileNumber}).`,
          type: 'info',
          recipientRole: 'admin',
          customerId: customer._id,
        });
      } catch (notifErr) {
        console.warn('Notification warning:', notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: `Call history${hasRecording ? ' and Audio Recording' : ''} successfully logged.`,
      callLog,
      customer,
    });
  } catch (error) {
    console.error('Log Call Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving call record: ' + error.message, error: error.message });
  }
};

// @desc    Direct upload call recording for a selected customer or direct customer info
// @route   POST /api/calls/upload-recording
// @access  Private
exports.uploadRecording = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      mobileNumber,
      companyName,
      productInterested,
      callDate,
      callTime,
      callResult,
      remarks,
      recordingDuration,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an audio file to upload.' });
    }

    let customer = null;

    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Selected customer record not found.' });
      }
    } else if (mobileNumber && mobileNumber.trim()) {
      customer = await Customer.findOne({ mobileNumber: mobileNumber.trim() });
      if (!customer) {
        // Auto-create customer lead
        customer = await Customer.create({
          customerName: customerName ? customerName.trim() : 'Phone Call Lead',
          mobileNumber: mobileNumber.trim(),
          companyName: companyName === 'CleanCruisers' ? 'CleanCruisers' : 'SofaShine',
          productInterested: productInterested || 'General Inquiry',
          salesEmployeeName: req.user.name || 'Sales Representative',
          createdByEmployeeId: req.user._id,
          lastUpdatedBy: req.user._id,
          followUpStatus: 'Contacted',
          remarks: remarks || '',
          timeline: [
            {
              action: 'CREATED',
              description: `Customer lead created via direct Call Recording upload by ${req.user.name}`,
              performedBy: req.user._id,
              performerName: req.user.name || 'User',
              timestamp: new Date(),
            },
          ],
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please select an existing customer or enter Customer Name and Mobile Number.',
      });
    }

    const recordingUrl = `/uploads/recordings/${req.file.filename}`;
    const recordingFileName = req.file.originalname;
    const recordingFileSize = req.file.size;
    const recordingMimeType = req.file.mimetype;
    const safeCallDate = parseSafeDate(callDate, new Date());

    let gridFsFileId = null;
    try {
      gridFsFileId = await saveFileToGridFS(req.file.path, req.file.filename, {
        customerId: customer._id,
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber,
        uploadedBy: req.user._id,
        originalName: req.file.originalname,
      });
    } catch (gridErr) {
      console.warn('GridFS save warning:', gridErr);
    }

    const callLog = await CallHistory.create({
      customerId: customer._id,
      customerName: customer.customerName || 'Customer',
      mobileNumber: customer.mobileNumber || '',
      companyName: customer.companyName || 'SofaShine',
      userId: req.user._id,
      salesEmployeeName: req.user.name || 'Sales Representative',
      callDate: safeCallDate,
      callTime: callTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      callResult: callResult || 'Connected',
      remarks: remarks || `Call recording uploaded on ${new Date().toLocaleDateString()}`,
      newStatus: customer.followUpStatus || 'Contacted',
      newFollowUpDate: customer.followUpDate,
      newFollowUpTime: customer.followUpTime,
      recordingUrl,
      recordingFileName,
      recordingFileSize,
      recordingMimeType,
      recordingDuration: recordingDuration || '',
      hasRecording: true,
      gridFsFileId,
    });

    // Append to customer timeline
    if (!customer.timeline) customer.timeline = [];
    customer.timeline.push({
      action: 'CALL_LOGGED',
      description: `🎙️ Call Recording Uploaded by ${req.user.name}: "${remarks || 'Customer discussion'}"`,
      performedBy: req.user._id,
      performerName: req.user.name || 'User',
      timestamp: new Date(),
      metadata: { callResult: callResult || 'Connected', hasRecording: true, recordingUrl },
    });
    customer.lastUpdatedBy = req.user._id;
    await customer.save();

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'User',
        userRole: req.user.role || 'employee',
        action: 'UPLOAD_RECORDING',
        targetId: customer._id,
        targetModel: 'Customer',
        details: `Uploaded call recording (${recordingFileName}) for customer "${customer.customerName}".`,
      });
    } catch (actErr) {
      console.warn('ActivityLog warning:', actErr);
    }

    // Notify Admin
    if (req.user.role === 'employee') {
      try {
        await Notification.create({
          title: '🎙️ New Call Recording Uploaded',
          message: `${req.user.name} uploaded a call recording for customer ${customer.customerName} (${customer.mobileNumber}).`,
          type: 'info',
          recipientRole: 'admin',
          customerId: customer._id,
        });
      } catch (notifErr) {
        console.warn('Notification warning:', notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Call recording uploaded successfully!',
      callLog,
    });
  } catch (error) {
    console.error('Upload Recording Error:', error);
    res.status(500).json({ success: false, message: 'Server error while uploading recording: ' + error.message, error: error.message });
  }
};

// @desc    Get recordings list for Hub (Admin view all, Employee view own)
// @route   GET /api/calls/recordings
// @access  Private
exports.getRecordings = async (req, res) => {
  try {
    const {
      search,
      employeeId,
      callResult,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const recordingMatch = {
      $or: [
        { hasRecording: true },
        { recordingUrl: { $exists: true, $ne: '', $ne: null } },
      ],
    };

    const query = { ...recordingMatch };

    // Role-based visibility
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (employeeId && employeeId !== 'all') {
      query.userId = employeeId;
    }

    // Call result filter
    if (callResult && callResult !== 'all') {
      query.callResult = callResult;
    }

    // Date range filter
    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.callDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.callDate.$lte = end;
      }
    }

    // Search query across customer name, phone, employee, remarks
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        recordingMatch,
        {
          $or: [
            { customerName: searchRegex },
            { mobileNumber: searchRegex },
            { salesEmployeeName: searchRegex },
            { remarks: searchRegex },
          ],
        },
      ];
      delete query.$or;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await CallHistory.countDocuments(query);
    const recordings = await CallHistory.find(query)
      .populate('customerId', 'customerName companyName mobileNumber city followUpStatus priority')
      .populate('userId', 'name email designation avatarColor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate quick stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const baseStatsQuery = req.user.role === 'employee' ? { userId: req.user._id, ...recordingMatch } : { ...recordingMatch };
    const todayRecordings = await CallHistory.countDocuments({
      ...baseStatsQuery,
      createdAt: { $gte: today, $lte: endToday },
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      recordings,
      stats: {
        totalRecordings: total,
        todayRecordings,
      },
    });
  } catch (error) {
    console.error('Get Recordings Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch call recordings.', error: error.message });
  }
};

// @desc    Get all call logs for a specific customer
// @route   GET /api/calls/:customerId
// @access  Private
exports.getCustomerCalls = async (req, res) => {
  try {
    const { customerId } = req.params;

    const calls = await CallHistory.find({ customerId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch call history.', error: error.message });
  }
};

// @desc    Get all calls (Admin or general)
// @route   GET /api/calls
// @access  Private
exports.getAllCalls = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    const calls = await CallHistory.find(query)
      .populate('customerId', 'customerName companyName mobileNumber')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch calls.', error: error.message });
  }
};

// @desc    Delete a call recording
// @route   DELETE /api/calls/recordings/:id
// @access  Private (Admin only)
exports.deleteRecording = async (req, res) => {
  try {
    const recording = await CallHistory.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Call recording not found.' });
    }

    if (req.user.role !== 'admin' && recording.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this recording.' });
    }

    // Try deleting physical audio file if exists
    if (recording.recordingUrl) {
      const filename = path.basename(recording.recordingUrl);
      const filePath = path.join(__dirname, '../../', recording.recordingUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Could not delete audio file from disk:', unlinkErr.message);
        }
      }

      // Delete from MongoDB Cloud GridFS permanently
      try {
        await deleteFileFromGridFS(filename);
      } catch (gridErr) {
        console.warn('GridFS delete error:', gridErr);
      }
    }

    await CallHistory.findByIdAndDelete(req.params.id);

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'User',
        userRole: req.user.role || 'admin',
        action: 'DELETE_RECORDING',
        targetId: recording.customerId,
        targetModel: 'Customer',
        details: `Deleted call recording for customer "${recording.customerName}".`,
      });
    } catch (actErr) {
      console.warn('ActivityLog warning:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Call recording deleted permanently.',
    });
  } catch (error) {
    console.error('Delete Recording Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete recording.', error: error.message });
  }
};

// @desc    Download audio recording file (with GridFS fallback)
// @route   GET /api/calls/recordings/:id/download
// @access  Private
exports.downloadRecordingFile = async (req, res) => {
  try {
    const recording = await CallHistory.findById(req.params.id);
    if (!recording || !recording.recordingUrl) {
      return res.status(404).json({ success: false, message: 'Recording audio file not found.' });
    }

    const filename = path.basename(recording.recordingUrl);
    const filePath = path.join(__dirname, '../../', recording.recordingUrl);
    const downloadName = recording.recordingFileName || `recording_${recording._id}.mp3`;

    if (fs.existsSync(filePath)) {
      return res.download(filePath, downloadName);
    }

    // Fallback to GridFS
    const streamed = await streamFileFromGridFS(filename, req, res, recording.recordingMimeType || 'audio/mpeg');
    if (!streamed) {
      return res.status(404).json({ success: false, message: 'Audio file not found on disk or database.' });
    }
  } catch (error) {
    console.error('Download recording error:', error);
    res.status(500).json({ success: false, message: 'Error downloading recording file.', error: error.message });
  }
};


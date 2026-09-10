const CashCollection = require('../models/CashCollection');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Helper to safely parse numbers with default fallback
const safeNumber = (val, defaultVal = 0) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : Math.max(0, num);
};

// @desc    Record a new cash/payment collection from a worker
// @route   POST /api/cash-collections
// @access  Private (Admin only)
exports.createCollection = async (req, res) => {
  try {
    const {
      date,
      employeeId,
      employeeName,
      amount,
      paymentMode = 'Cash',
      companyName = 'SofaShine',
      customerReference = '',
      receiptNo = '',
      status = 'Received',
      notes = '',
    } = req.body;

    let finalEmployeeName = (employeeName || '').trim();

    if (!finalEmployeeName && employeeId) {
      const user = await User.findById(employeeId).select('name');
      if (user) {
        finalEmployeeName = user.name;
      }
    }

    if (!finalEmployeeName) {
      return res.status(400).json({ success: false, message: 'Please enter Worker / Sales Employee name.' });
    }

    const parsedAmount = safeNumber(amount, 0);
    if (parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount collected must be greater than 0.' });
    }

    const collectionDate = date ? new Date(date) : new Date();

    const collection = await CashCollection.create({
      date: collectionDate,
      employeeId: employeeId || undefined,
      employeeName: finalEmployeeName,
      amount: parsedAmount,
      paymentMode,
      companyName,
      customerReference: customerReference.trim(),
      receiptNo: receiptNo.trim(),
      status,
      notes: notes.trim(),
      collectedByAdminId: req.user._id,
      collectedByAdminName: req.user.name || 'Admin',
    });

    // Log activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: 'RECORD_CASH_COLLECTION',
        targetId: collection._id,
        targetModel: 'CashCollection',
        details: `Recorded ₹${parsedAmount.toLocaleString('en-IN')} cash collection from ${finalEmployeeName} (${paymentMode}, ${companyName}).`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(201).json({
      success: true,
      message: `Cash collection of ₹${parsedAmount.toLocaleString('en-IN')} recorded successfully!`,
      collection,
    });
  } catch (error) {
    console.error('Create Cash Collection Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record cash collection.',
    });
  }
};

// @desc    Get all cash collections with metrics, filters, and pagination
// @route   GET /api/cash-collections
// @access  Private (Admin only)
exports.getCollections = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Worker Name or ID
    if (req.query.workerName && req.query.workerName !== 'all') {
      query.employeeName = req.query.workerName;
    } else if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.employeeId = req.query.employeeId;
    }

    // Filter by Company
    if (req.query.companyName && req.query.companyName !== 'all') {
      query.companyName = req.query.companyName;
    }

    // Filter by Payment Mode
    if (req.query.paymentMode && req.query.paymentMode !== 'all') {
      query.paymentMode = req.query.paymentMode;
    }

    // Filter by Status
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Date Filtering
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

    // Live search
    if (req.query.search && req.query.search.trim()) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { employeeName: regex },
        { receiptNo: regex },
        { customerReference: regex },
        { notes: regex },
      ];
    }

    // 1. Fetch paginated list
    const total = await CashCollection.countDocuments(query);
    const collections = await CashCollection.find(query)
      .populate('employeeId', 'name email designation phone avatarColor')
      .populate('collectedByAdminId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 2. Aggregate Metrics (Total for current filter)
    const aggregateMetrics = await CashCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalFilteredAmount = aggregateMetrics[0]?.totalCollected || 0;

    // 3. Today's Total Metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayQuery = {
      date: { $gte: startOfToday, $lte: endOfToday },
    };
    if (query.employeeName) todayQuery.employeeName = query.employeeName;
    else if (query.employeeId) todayQuery.employeeId = query.employeeId;

    const todayMetrics = await CashCollection.aggregate([
      { $match: todayQuery },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const todayAmount = todayMetrics[0]?.total || 0;
    const todayCount = todayMetrics[0]?.count || 0;

    // 4. This Month's Total Metrics
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthQuery = {
      date: { $gte: startOfMonth },
    };
    if (query.employeeName) monthQuery.employeeName = query.employeeName;
    else if (query.employeeId) monthQuery.employeeId = query.employeeId;

    const monthMetrics = await CashCollection.aggregate([
      { $match: monthQuery },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const thisMonthAmount = monthMetrics[0]?.total || 0;

    // 5. Worker Breakdown for current filter (grouped by worker name)
    const workerBreakdown = await CashCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$employeeName',
          employeeName: { $first: '$employeeName' },
          totalAmount: { $sum: '$amount' },
          collectionsCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    // 6. Distinct worker names list for filters
    const distinctWorkers = await CashCollection.distinct('employeeName');

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      stats: {
        totalFilteredAmount,
        todayAmount,
        todayCount,
        thisMonthAmount,
        workerBreakdown,
        distinctWorkers: distinctWorkers.filter(Boolean).sort(),
      },
      collections,
    });
  } catch (error) {
    console.error('Get Cash Collections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash collections.',
      error: error.message,
    });
  }
};

// @desc    Get single collection details
// @route   GET /api/cash-collections/:id
// @access  Private (Admin only)
exports.getCollectionById = async (req, res) => {
  try {
    const collection = await CashCollection.findById(req.params.id)
      .populate('employeeId', 'name email designation phone avatarColor')
      .populate('collectedByAdminId', 'name email');

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection entry not found.' });
    }

    res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch collection details.', error: error.message });
  }
};

// @desc    Update a cash collection entry
// @route   PUT /api/cash-collections/:id
// @access  Private (Admin only)
exports.updateCollection = async (req, res) => {
  try {
    const collection = await CashCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection entry not found.' });
    }

    const {
      date,
      employeeId,
      employeeName,
      amount,
      paymentMode,
      companyName,
      customerReference,
      receiptNo,
      status,
      notes,
    } = req.body;

    if (date) collection.date = new Date(date);
    if (employeeId) collection.employeeId = employeeId;
    if (employeeName) collection.employeeName = employeeName;
    if (amount !== undefined) collection.amount = safeNumber(amount, collection.amount);
    if (paymentMode) collection.paymentMode = paymentMode;
    if (companyName) collection.companyName = companyName;
    if (customerReference !== undefined) collection.customerReference = customerReference.trim();
    if (receiptNo !== undefined) collection.receiptNo = receiptNo.trim();
    if (status) collection.status = status;
    if (notes !== undefined) collection.notes = notes.trim();

    await collection.save();

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: 'UPDATE_CASH_COLLECTION',
        targetId: collection._id,
        targetModel: 'CashCollection',
        details: `Updated cash collection entry for ${collection.employeeName} (₹${collection.amount.toLocaleString('en-IN')}).`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cash collection entry updated successfully.',
      collection,
    });
  } catch (error) {
    console.error('Update Cash Collection Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cash collection.',
    });
  }
};

// @desc    Delete a cash collection entry
// @route   DELETE /api/cash-collections/:id
// @access  Private (Admin only)
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await CashCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection entry not found.' });
    }

    await CashCollection.findByIdAndDelete(req.params.id);

    // Log Activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: 'DELETE_CASH_COLLECTION',
        targetId: req.params.id,
        targetModel: 'CashCollection',
        details: `Deleted cash collection of ₹${collection.amount.toLocaleString('en-IN')} from ${collection.employeeName} on ${new Date(collection.date).toLocaleDateString()}.`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cash collection entry deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Cash Collection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cash collection.',
      error: error.message,
    });
  }
};

// @desc    Export all filtered cash collections (raw JSON for client CSV download)
// @route   GET /api/cash-collections/export/data
// @access  Private (Admin only)
exports.exportCollectionData = async (req, res) => {
  try {
    const query = {};
    if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.employeeId = req.query.employeeId;
    }
    if (req.query.companyName && req.query.companyName !== 'all') {
      query.companyName = req.query.companyName;
    }
    if (req.query.paymentMode && req.query.paymentMode !== 'all') {
      query.paymentMode = req.query.paymentMode;
    }
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const collections = await CashCollection.find(query)
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed.', error: error.message });
  }
};

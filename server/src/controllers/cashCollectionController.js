const mongoose = require('mongoose');
const CashCollection = require('../models/CashCollection');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Helper to safely parse numbers with default fallback
const safeNumber = (val, defaultVal = 0) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : Math.max(0, num);
};

// @desc    Record a new cash/payment collection or expense from a worker
// @route   POST /api/cash-collections
// @access  Private (Admin only)
exports.createCollection = async (req, res) => {
  try {
    const {
      date,
      employeeId,
      employeeName,
      amount,
      type = 'Collection',
      category = 'General',
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
      return res.status(400).json({ success: false, message: 'Please enter Worker / Sales Employee / Payee name.' });
    }

    const parsedAmount = safeNumber(amount, 0);
    if (parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }

    const isExpense = type === 'Expense';
    const finalType = isExpense ? 'Expense' : 'Collection';
    const finalCategory = (category || (isExpense ? 'General Expense' : 'Collection')).trim();
    const collectionDate = date ? new Date(date) : new Date();

    const collection = await CashCollection.create({
      date: collectionDate,
      employeeId: employeeId || undefined,
      employeeName: finalEmployeeName,
      amount: parsedAmount,
      type: finalType,
      category: finalCategory,
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
      const actionText = isExpense
        ? `Recorded cash expense / deduction of ₹${parsedAmount.toLocaleString('en-IN')} for ${finalEmployeeName} (${finalCategory}, ${paymentMode}, ${companyName}).`
        : `Recorded ₹${parsedAmount.toLocaleString('en-IN')} cash collection from ${finalEmployeeName} (${paymentMode}, ${companyName}).`;

      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: isExpense ? 'RECORD_CASH_EXPENSE' : 'RECORD_CASH_COLLECTION',
        targetId: collection._id,
        targetModel: 'CashCollection',
        details: actionText,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(201).json({
      success: true,
      message: isExpense
        ? `Cash expense of ₹${parsedAmount.toLocaleString('en-IN')} recorded & deducted successfully!`
        : `Cash collection of ₹${parsedAmount.toLocaleString('en-IN')} recorded successfully!`,
      collection,
    });
  } catch (error) {
    console.error('Create Cash Entry Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record cash entry.',
    });
  }
};

// @desc    Get all cash collections & expenses with net balance metrics, filters, and pagination
// @route   GET /api/cash-collections
// @access  Private (Admin only)
exports.getCollections = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Type (Collection / Expense / all)
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Filter by Worker Name or ID
    if (req.query.workerName && req.query.workerName !== 'all') {
      query.employeeName = req.query.workerName;
    } else if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.employeeId = req.query.employeeId;
    }

    // Filter by Category
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
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
        { category: regex },
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

    // 2. Aggregate Metrics (Total Collected, Total Expense, Net Balance for current filter)
    const aggregateMetrics = await CashCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCollected: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 0, '$amount'],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
          collectionCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 0, 1],
            },
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totalCollected = aggregateMetrics[0]?.totalCollected || 0;
    const totalExpense = aggregateMetrics[0]?.totalExpense || 0;
    const netBalance = totalCollected - totalExpense;

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
      {
        $group: {
          _id: null,
          collected: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 0, '$amount'],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const todayCollected = todayMetrics[0]?.collected || 0;
    const todayExpense = todayMetrics[0]?.expense || 0;
    const todayNet = todayCollected - todayExpense;
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
      {
        $group: {
          _id: null,
          collected: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 0, '$amount'],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const thisMonthCollected = monthMetrics[0]?.collected || 0;
    const thisMonthExpense = monthMetrics[0]?.expense || 0;
    const thisMonthNet = thisMonthCollected - thisMonthExpense;

    // 5. Worker Breakdown for current filter (grouped by worker name)
    const workerBreakdown = await CashCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$employeeName',
          employeeName: { $first: '$employeeName' },
          totalCollected: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, 0, '$amount'],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
            },
          },
          collectionsCount: { $sum: 1 },
        },
      },
      {
        $addFields: {
          netAmount: { $subtract: ['$totalCollected', '$totalExpense'] },
        },
      },
      { $sort: { netAmount: -1, totalCollected: -1 } },
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
        totalCollected,
        totalExpense,
        netBalance,
        totalFilteredAmount: netBalance,
        todayCollected,
        todayExpense,
        todayNet,
        todayAmount: todayNet,
        todayCount,
        thisMonthCollected,
        thisMonthExpense,
        thisMonthNet,
        thisMonthAmount: thisMonthNet,
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
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid cash entry ID.' });
    }

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

// @desc    Update a cash collection or expense entry
// @route   PUT /api/cash-collections/:id
// @access  Private (Admin only)
exports.updateCollection = async (req, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid cash entry ID.' });
    }

    const collection = await CashCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection entry not found.' });
    }

    const {
      date,
      employeeId,
      employeeName,
      amount,
      type,
      category,
      paymentMode,
      companyName,
      customerReference,
      receiptNo,
      status,
      notes,
    } = req.body;

    if (date) collection.date = new Date(date);
    if (employeeId !== undefined) collection.employeeId = employeeId || undefined;
    if (employeeName) collection.employeeName = employeeName.trim();
    if (amount !== undefined) collection.amount = safeNumber(amount, collection.amount);
    if (type) collection.type = type === 'Expense' ? 'Expense' : 'Collection';
    if (category !== undefined) collection.category = category.trim();
    if (paymentMode) collection.paymentMode = paymentMode;
    if (companyName) collection.companyName = companyName;
    if (customerReference !== undefined) collection.customerReference = customerReference.trim();
    if (receiptNo !== undefined) collection.receiptNo = receiptNo.trim();
    if (status) collection.status = status;
    if (notes !== undefined) collection.notes = notes.trim();

    await collection.save();

    // Log Activity
    try {
      const isExp = collection.type === 'Expense';
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: isExp ? 'UPDATE_CASH_EXPENSE' : 'UPDATE_CASH_COLLECTION',
        targetId: collection._id,
        targetModel: 'CashCollection',
        details: `Updated ${isExp ? 'cash expense' : 'cash collection'} entry for ${collection.employeeName} (₹${collection.amount.toLocaleString('en-IN')}).`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cash entry updated successfully.',
      collection,
    });
  } catch (error) {
    console.error('Update Cash Entry Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cash entry.',
    });
  }
};

// @desc    Delete a cash collection entry
// @route   DELETE /api/cash-collections/:id
// @access  Private (Admin only)
exports.deleteCollection = async (req, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid cash entry ID.' });
    }

    const collection = await CashCollection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    await CashCollection.findByIdAndDelete(req.params.id);

    // Log Activity
    try {
      const isExp = collection.type === 'Expense';
      await ActivityLog.create({
        userId: req.user._id,
        userName: req.user.name || 'Admin',
        userRole: req.user.role || 'admin',
        action: isExp ? 'DELETE_CASH_EXPENSE' : 'DELETE_CASH_COLLECTION',
        targetId: req.params.id,
        targetModel: 'CashCollection',
        details: `Deleted ${isExp ? 'cash expense' : 'cash collection'} of ₹${collection.amount.toLocaleString('en-IN')} for ${collection.employeeName}.`,
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cash entry deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Cash Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cash entry.',
      error: error.message,
    });
  }
};

// @desc    Export all filtered cash collections & expenses
// @route   GET /api/cash-collections/export/data
// @access  Private (Admin only)
exports.exportCollectionData = async (req, res) => {
  try {
    const query = {};
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }
    if (req.query.employeeName && req.query.employeeName !== 'all') {
      query.employeeName = req.query.employeeName;
    } else if (req.query.employeeId && req.query.employeeId !== 'all') {
      query.employeeId = req.query.employeeId;
    }
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
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


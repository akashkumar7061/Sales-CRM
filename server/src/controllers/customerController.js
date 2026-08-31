const Customer = require('../models/Customer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createLog } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// @desc    Get customers (Filtered by role, priority, status, date, overdue, etc.)
// @route   GET /api/customers
// @access  Private (Approved users)
exports.getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      employeeId,
      companyName,
      status,
      priority,
      leadSource,
      location,
      startDate,
      endDate,
      followUpStart,
      followUpEnd,
      followUpFilter, // 'due_today' | 'upcoming' | 'overdue' | 'all'
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role-based scoping
    if (req.user.role !== 'admin') {
      // Sales employee can ONLY view customers created by themselves
      query.createdByEmployeeId = req.user._id;
    } else if (employeeId && employeeId !== 'all') {
      // Admin filter by specific employee
      query.createdByEmployeeId = employeeId;
    }

    // Company name filter (SofaShine / CleanCruisers)
    if (companyName && companyName !== 'all') {
      query.companyName = companyName;
    }

    // Status filter
    if (status && status !== 'all') {
      query.followUpStatus = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Lead source filter
    if (leadSource && leadSource !== 'all') {
      query.leadSource = leadSource;
    }

    // Location / City filter
    if (location && location !== 'all') {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
      ];
    }

    // Date range filter (Entry Date)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Follow-up tab filters (due_today, overdue, upcoming)
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (followUpFilter === 'due_today') {
      query.followUpDate = { $gte: startOfToday, $lte: endOfToday };
      query.followUpStatus = { $nin: ['Converted', 'Lost'] };
    } else if (followUpFilter === 'overdue') {
      query.followUpDate = { $lt: startOfToday };
      query.followUpStatus = { $nin: ['Converted', 'Lost'] };
    } else if (followUpFilter === 'upcoming') {
      query.followUpDate = { $gt: endOfToday };
      query.followUpStatus = { $nin: ['Converted', 'Lost'] };
    } else if (followUpStart || followUpEnd) {
      query.followUpDate = {};
      if (followUpStart) query.followUpDate.$gte = new Date(followUpStart);
      if (followUpEnd) {
        const end = new Date(followUpEnd);
        end.setHours(23, 59, 59, 999);
        query.followUpDate.$lte = end;
      }
    }

    // Free text search across customer name, company name, mobile, location, city, product, employee name
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { customerName: searchRegex },
        { companyName: searchRegex },
        { mobileNumber: searchRegex },
        { altMobileNumber: searchRegex },
        { email: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { productInterested: searchRegex },
        { salesEmployeeName: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Pagination & Sorting
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .populate('createdByEmployeeId', 'name email designation phone avatarColor')
      .populate('lastUpdatedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Also get quick overview counts for follow-up tabs
    const baseRoleQuery = req.user.role !== 'admin' ? { createdByEmployeeId: req.user._id } : {};
    const dueTodayCount = await Customer.countDocuments({
      ...baseRoleQuery,
      followUpDate: { $gte: startOfToday, $lte: endOfToday },
      followUpStatus: { $nin: ['Converted', 'Lost'] },
    });
    const overdueCount = await Customer.countDocuments({
      ...baseRoleQuery,
      followUpDate: { $lt: startOfToday },
      followUpStatus: { $nin: ['Converted', 'Lost'] },
    });

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      tabCounts: {
        dueToday: dueTodayCount,
        overdue: overdueCount,
      },
      customers,
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer records.',
    });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdByEmployeeId', 'name email designation phone avatarColor')
      .populate('lastUpdatedBy', 'name email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    // Role check: Employee can only view their own
    if (
      req.user.role !== 'admin' &&
      customer.createdByEmployeeId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view customers created by you.',
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details.',
    });
  }
};

// @desc    Check if mobile number is duplicate
// @route   POST /api/customers/check-duplicate
// @access  Private
exports.checkDuplicateMobile = async (req, res) => {
  try {
    const { mobileNumber, excludeId } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const query = { mobileNumber: mobileNumber.trim() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Customer.findOne(query).populate('createdByEmployeeId', 'name');

    if (existing) {
      return res.status(200).json({
        isDuplicate: true,
        message: `Customer already exists with this mobile number (${existing.customerName}, created by ${existing.salesEmployeeName}).`,
        customer: {
          id: existing._id,
          customerName: existing.customerName,
          companyName: existing.companyName,
          salesEmployeeName: existing.salesEmployeeName,
          followUpStatus: existing.followUpStatus,
          priority: existing.priority,
          date: existing.date,
        },
      });
    }

    res.status(200).json({
      isDuplicate: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking duplicate mobile number.',
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const {
      date,
      customerName,
      companyName,
      mobileNumber,
      altMobileNumber,
      email,
      location,
      fullAddress,
      city,
      state,
      productInterested,
      leadSource,
      priority,
      customerRequirement,
      followUpDate,
      followUpTime,
      followUpStatus,
      remarks,
      assignedEmployeeId, // Only admin can assign to another employee
    } = req.body;

    // Mobile Number Duplicate Check
    const existingCustomer = await Customer.findOne({ mobileNumber: mobileNumber.trim() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        isDuplicate: true,
        message: `A customer with mobile number ${mobileNumber} already exists in CRM.`,
        existingCustomer: {
          id: existingCustomer._id,
          customerName: existingCustomer.customerName,
          companyName: existingCustomer.companyName,
          salesEmployeeName: existingCustomer.salesEmployeeName,
          followUpStatus: existingCustomer.followUpStatus,
          date: existingCustomer.date,
        },
      });
    }

    let salesEmployeeName = req.user.name;
    let createdByEmployeeId = req.user._id;

    // If Admin is creating and chose a specific employee:
    if (req.user.role === 'admin' && assignedEmployeeId) {
      const assignedEmp = await User.findById(assignedEmployeeId);
      if (assignedEmp) {
        salesEmployeeName = assignedEmp.name;
        createdByEmployeeId = assignedEmp._id;
      }
    }

    const initialTimeline = [
      {
        action: 'CREATED',
        description: `Customer lead registered for ${companyName || 'SofaShine'} by ${req.user.name}`,
        performedBy: req.user._id,
        performerName: req.user.name,
        timestamp: new Date(),
        metadata: {
          leadSource: leadSource || 'Website',
          priority: priority || 'Warm',
          status: followUpStatus || 'New Lead',
        },
      },
    ];

    const customer = await Customer.create({
      date: date || new Date(),
      customerName,
      companyName: companyName === 'CleanCruisers' ? 'CleanCruisers' : 'SofaShine',
      mobileNumber: mobileNumber.trim(),
      altMobileNumber: altMobileNumber || '',
      email: email || '',
      location,
      fullAddress: fullAddress || '',
      city,
      state,
      productInterested,
      leadSource: leadSource || 'Website',
      priority: priority || 'Warm',
      customerRequirement: customerRequirement || '',
      followUpDate,
      followUpTime: followUpTime || '11:00 AM',
      followUpStatus: followUpStatus || 'New Lead',
      remarks: remarks || '',
      salesEmployeeName,
      createdByEmployeeId,
      lastUpdatedBy: req.user._id,
      timeline: initialTimeline,
      documents: [],
    });

    // If assigned to another employee by admin, send notification
    if (req.user.role === 'admin' && createdByEmployeeId.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipientId: createdByEmployeeId,
        recipientRole: 'employee',
        title: '📋 New Customer Assigned to You',
        message: `Admin assigned a new customer lead "${customer.customerName}" (${customer.companyName}) to your pipeline.`,
        type: 'lead_assigned',
        link: '/employee/customers',
      });
    }

    // Log the creation
    await createLog({
      user: req.user,
      action: 'CREATE_CUSTOMER',
      details: `Created customer ${customer.customerName} [${customer.companyName}] (${customer.mobileNumber}) assigned to ${salesEmployeeName}.`,
      metadata: { customerId: customer._id },
    });

    res.status(201).json({
      success: true,
      message: 'Customer saved successfully!',
      customer,
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save customer record.',
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const isAdmin = req.user.role === 'admin';

    // Verify ownership if not admin
    if (!isAdmin && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit customer records created by you.',
      });
    }

    const {
      date,
      customerName,
      companyName,
      mobileNumber,
      altMobileNumber,
      email,
      location,
      fullAddress,
      city,
      state,
      productInterested,
      leadSource,
      priority,
      customerRequirement,
      followUpDate,
      followUpTime,
      followUpStatus,
      remarks,
      salesEmployeeName,
      assignedEmployeeId,
    } = req.body;

    // Check duplicate mobile if mobile is changing
    if (mobileNumber && mobileNumber.trim() !== customer.mobileNumber) {
      const duplicate = await Customer.findOne({
        mobileNumber: mobileNumber.trim(),
        _id: { $ne: customer._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another customer (${duplicate.customerName}) already has the mobile number ${mobileNumber}.`,
        });
      }
      customer.mobileNumber = mobileNumber.trim();
    }

    // Check for timeline tracking
    const changes = [];
    if (followUpStatus && followUpStatus !== customer.followUpStatus) {
      changes.push(`Status changed from "${customer.followUpStatus}" to "${followUpStatus}"`);
    }
    if (priority && priority !== customer.priority) {
      changes.push(`Priority changed from "${customer.priority}" to "${priority}"`);
    }
    if (followUpDate && new Date(followUpDate).toISOString() !== new Date(customer.followUpDate).toISOString()) {
      changes.push(`Follow-up rescheduled to ${new Date(followUpDate).toLocaleDateString()} ${followUpTime || customer.followUpTime}`);
    }

    if (date) customer.date = date;
    if (customerName) customer.customerName = customerName;
    if (companyName) customer.companyName = companyName === 'CleanCruisers' ? 'CleanCruisers' : 'SofaShine';
    if (altMobileNumber !== undefined) customer.altMobileNumber = altMobileNumber;
    if (email !== undefined) customer.email = email;
    if (location) customer.location = location;
    if (fullAddress !== undefined) customer.fullAddress = fullAddress;
    if (city) customer.city = city;
    if (state) customer.state = state;
    if (productInterested) customer.productInterested = productInterested;
    if (leadSource) customer.leadSource = leadSource;
    if (priority) customer.priority = priority;
    if (customerRequirement !== undefined) customer.customerRequirement = customerRequirement;
    if (followUpDate) customer.followUpDate = followUpDate;
    if (followUpTime) customer.followUpTime = followUpTime;
    if (followUpStatus) customer.followUpStatus = followUpStatus;
    if (remarks !== undefined) customer.remarks = remarks;

    // RESTRICTED FIELD RULE: Only admin can modify salesEmployeeName or reassign employee!
    if (isAdmin) {
      if (assignedEmployeeId && assignedEmployeeId.toString() !== customer.createdByEmployeeId.toString()) {
        const emp = await User.findById(assignedEmployeeId);
        if (emp) {
          const prevName = customer.salesEmployeeName;
          customer.createdByEmployeeId = emp._id;
          customer.salesEmployeeName = emp.name;
          changes.push(`Lead reassigned from "${prevName}" to "${emp.name}"`);

          // Notify new assigned rep
          await Notification.create({
            recipientId: emp._id,
            recipientRole: 'employee',
            title: '📋 Customer Reassigned to You',
            message: `Lead "${customer.customerName}" has been reassigned to your profile by Admin.`,
            type: 'lead_assigned',
            link: '/employee/customers',
          });
        }
      } else if (salesEmployeeName && salesEmployeeName !== customer.salesEmployeeName) {
        customer.salesEmployeeName = salesEmployeeName;
      }
    }

    // Append timeline entries
    if (changes.length > 0) {
      changes.forEach((changeText) => {
        customer.timeline.push({
          action: 'UPDATE',
          description: changeText,
          performedBy: req.user._id,
          performerName: req.user.name,
          timestamp: new Date(),
        });
      });
    }

    customer.lastUpdatedBy = req.user._id;
    await customer.save();

    // Log update
    await createLog({
      user: req.user,
      action: 'UPDATE_CUSTOMER',
      details: `Updated customer ${customer.customerName} (${customer.mobileNumber}). Changes: ${changes.join(', ') || 'Details modified'}`,
      metadata: { customerId: customer._id },
    });

    res.status(200).json({
      success: true,
      message: 'Customer details updated successfully!',
      customer,
    });
  } catch (error) {
    console.error('updateCustomer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer.',
    });
  }
};

// @desc    Upload document for customer
// @route   POST /api/customers/:id/documents
// @access  Private
exports.uploadCustomerDocument = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    if (req.user.role !== 'admin' && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file.' });
    }

    const { docType = 'Other' } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const newDoc = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      docType,
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
      uploadedAt: new Date(),
    };

    customer.documents.push(newDoc);
    customer.timeline.push({
      action: 'DOC_UPLOADED',
      description: `Uploaded ${docType}: "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB)`,
      performedBy: req.user._id,
      performerName: req.user.name,
      timestamp: new Date(),
      metadata: { originalName: req.file.originalname, docType },
    });

    await customer.save();

    await createLog({
      user: req.user,
      action: 'UPLOAD_DOCUMENT',
      details: `Uploaded ${docType} "${req.file.originalname}" for customer ${customer.customerName}.`,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      document: customer.documents[customer.documents.length - 1],
      customer,
    });
  } catch (error) {
    console.error('Upload Document Error:', error);
    res.status(500).json({ success: false, message: 'Document upload failed.', error: error.message });
  }
};

// @desc    Delete document from customer
// @route   DELETE /api/customers/:id/documents/:docId
// @access  Private
exports.deleteCustomerDocument = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    if (req.user.role !== 'admin' && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const doc = customer.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Attempt to delete physical file if exists
    const filePath = path.join(__dirname, '../../uploads/documents', doc.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink file:', err);
      }
    }

    const docName = doc.originalName;
    customer.documents.pull(req.params.docId);

    customer.timeline.push({
      action: 'DOC_DELETED',
      description: `Removed document: "${docName}"`,
      performedBy: req.user._id,
      performerName: req.user.name,
      timestamp: new Date(),
    });

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete document.', error: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && customer.createdByEmployeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own customer records.',
      });
    }

    const customerName = customer.customerName;
    const mobile = customer.mobileNumber;

    await Customer.findByIdAndDelete(req.params.id);

    await createLog({
      user: req.user,
      action: 'DELETE_CUSTOMER',
      details: `Deleted customer ${customerName} (${mobile}).`,
    });

    res.status(200).json({
      success: true,
      message: 'Customer record deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer.',
    });
  }
};

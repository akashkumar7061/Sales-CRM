const XLSX = require('xlsx');
const Customer = require('../models/Customer');
const User = require('../models/User');
const CallHistory = require('../models/CallHistory');
const Target = require('../models/Target');
const DailyReport = require('../models/DailyReport');
const ActivityLog = require('../models/ActivityLog');
const { createLog } = require('../utils/logger');

// @desc    Export customer data (Excel or CSV) with comprehensive filters
// @route   GET /api/import-export/export
// @access  Private
exports.exportCustomers = async (req, res) => {
  try {
    const { format = 'xlsx', employeeId, companyName, status, priority, leadSource, startDate, endDate, search } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.createdByEmployeeId = req.user._id;
    } else if (employeeId && employeeId !== 'all') {
      query.createdByEmployeeId = employeeId;
    }

    if (companyName && companyName !== 'all') query.companyName = companyName;
    if (status && status !== 'all') query.followUpStatus = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (leadSource && leadSource !== 'all') query.leadSource = leadSource;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { mobileNumber: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { salesEmployeeName: searchRegex },
      ];
    }

    const customers = await Customer.find(query)
      .populate('createdByEmployeeId', 'name email')
      .sort({ createdAt: -1 });

    const data = customers.map((c, index) => ({
      'S.No': index + 1,
      'Entry Date': c.date ? new Date(c.date).toISOString().split('T')[0] : '',
      'Customer Name': c.customerName || '',
      'Business / Company': c.companyName || 'SofaShine',
      'Priority': c.priority || 'Warm',
      'Mobile Number': c.mobileNumber || '',
      'Alternate Mobile': c.altMobileNumber || '',
      'Email': c.email || '',
      'Location': c.location || '',
      'City': c.city || '',
      'State': c.state || '',
      'Full Address': c.fullAddress || '',
      'Product / Service': c.productInterested || '',
      'Lead Source': c.leadSource || '',
      'Requirement': c.customerRequirement || '',
      'Follow-up Date': c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '',
      'Follow-up Time': c.followUpTime || '11:00 AM',
      'Follow-up Status': c.followUpStatus || '',
      'Remarks': c.remarks || '',
      'Sales Employee': c.salesEmployeeName || '',
      'Documents Count': c.documents?.length || 0,
      'Created At': c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    await createLog({
      user: req.user,
      action: 'EXPORT_CUSTOMERS',
      details: `${req.user.name} exported ${customers.length} customer records (${format.toUpperCase()}).`,
    });

    if (format === 'csv') {
      const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'buffer' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=customers_${Date.now()}.csv`);
      return res.send(csvBuffer);
    } else {
      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=customers_${Date.now()}.xlsx`);
      return res.send(xlsxBuffer);
    }
  } catch (error) {
    console.error('exportCustomers error:', error);
    res.status(500).json({ success: false, message: 'Failed to export customer records.' });
  }
};

// @desc    Export Master Multi-Sheet Complete CRM Data Backup
// @route   GET /api/import-export/backup-all
// @access  Private (Admin only)
exports.exportMasterBackup = async (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Fetch Customers
    const customers = await Customer.find().sort({ createdAt: -1 });
    const customersData = customers.map((c, i) => ({
      'S.No': i + 1,
      'Entry Date': c.date ? new Date(c.date).toISOString().split('T')[0] : '',
      'Customer Name': c.customerName || '',
      'Brand': c.companyName || 'SofaShine',
      'Priority': c.priority || 'Warm',
      'Mobile Number': c.mobileNumber || '',
      'Alt Mobile': c.altMobileNumber || '',
      'Email': c.email || '',
      'Location': c.location || '',
      'City': c.city || '',
      'State': c.state || '',
      'Full Address': c.fullAddress || '',
      'Product / Service': c.productInterested || '',
      'Lead Source': c.leadSource || '',
      'Requirement': c.customerRequirement || '',
      'Follow-up Date': c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '',
      'Follow-up Time': c.followUpTime || '11:00 AM',
      'Follow-up Status': c.followUpStatus || '',
      'Remarks': c.remarks || '',
      'Sales Rep': c.salesEmployeeName || '',
      'Documents Count': c.documents?.length || 0,
      'Created At': c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
    }));
    const customerSheet = XLSX.utils.json_to_sheet(customersData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, '1_Customers_Leads');

    // 2. Fetch Call History
    const calls = await CallHistory.find().sort({ callDate: -1 });
    const callsData = calls.map((cl, i) => ({
      'S.No': i + 1,
      'Call Date & Time': new Date(cl.callDate).toLocaleString(),
      'Customer Name': cl.customerName || '',
      'Mobile Number': cl.mobileNumber || '',
      'Employee Name': cl.employeeName || '',
      'Call Outcome': cl.callResult || '',
      'Call Duration': cl.callDuration || '0m',
      'Call Notes / Remarks': cl.callNotes || '',
      'Next Action': cl.nextAction || '',
      'Updated Status': cl.statusAfterCall || '',
      'New Follow-up Date': cl.newFollowUpDate ? new Date(cl.newFollowUpDate).toISOString().split('T')[0] : '',
    }));
    const callSheet = XLSX.utils.json_to_sheet(callsData);
    XLSX.utils.book_append_sheet(workbook, callSheet, '2_Call_History');

    // 3. Fetch Sales Targets
    const targets = await Target.find().sort({ month: -1 });
    const targetsData = targets.map((t, i) => ({
      'S.No': i + 1,
      'Month': t.month || '',
      'Employee Name': t.employeeName || '',
      'Monthly Leads Target': t.monthlyLeadTarget || 0,
      'Daily Leads Target': t.dailyLeadTarget || 0,
      'Monthly Calls Target': t.monthlyCallTarget || 0,
      'Daily Calls Target': t.dailyCallTarget || 0,
      'Monthly Conversions Target': t.monthlyConversionTarget || 0,
      'Daily Conversions Target': t.dailyConversionTarget || 0,
      'Assigned By': t.assignedByName || 'Admin',
      'Notes': t.notes || '',
    }));
    const targetSheet = XLSX.utils.json_to_sheet(targetsData);
    XLSX.utils.book_append_sheet(workbook, targetSheet, '3_Sales_Targets');

    // 4. Fetch Daily Work & Attendance Reports
    const reports = await DailyReport.find().sort({ date: -1 });
    const reportsData = reports.map((r, i) => ({
      'S.No': i + 1,
      'Date': new Date(r.date).toLocaleDateString(),
      'Employee Name': r.employeeName || '',
      'Attendance Status': r.attendanceStatus || '',
      'Clock In Time': r.clockInTime || '',
      'Clock Out Time': r.clockOutTime || '',
      'Calls Contacted': r.customersContacted || 0,
      'Follow-ups Done': r.followupsCompleted || 0,
      'Leads Added': r.newLeadsAdded || 0,
      'Deals Converted': r.dealsConverted || 0,
      'Daily Summary Remarks': r.remarks || '',
    }));
    const reportSheet = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportSheet, '4_Daily_Reports');

    // 5. Fetch Activity Logs
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(1000);
    const logsData = logs.map((l, i) => ({
      'S.No': i + 1,
      'Timestamp': new Date(l.createdAt).toLocaleString(),
      'User Name': l.userName || '',
      'User Role': l.userRole || '',
      'Action': l.action || '',
      'Details': l.details || '',
      'IP Address': l.ipAddress || '',
    }));
    const logSheet = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(workbook, logSheet, '5_Activity_Audit_Logs');

    // 6. Fetch Users Directory
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const usersData = users.map((u, i) => ({
      'S.No': i + 1,
      'Full Name': u.name || '',
      'Email Address': u.email || '',
      'Phone Number': u.phone || '',
      'Designation': u.designation || '',
      'Role': u.role || '',
      'Approval Status': u.status || '',
      'Registered Date': new Date(u.createdAt).toLocaleDateString(),
    }));
    const userSheet = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, userSheet, '6_Employees_Directory');

    await createLog({
      user: req.user,
      action: 'EXPORT_CUSTOMERS',
      details: `${req.user.name} generated and downloaded COMPLETE CRM MASTER BACKUP (All 6 Database Collections).`,
    });

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CRM_MASTER_DATABASE_BACKUP_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('exportMasterBackup error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate complete master backup.' });
  }
};

// @desc    Export Single Module Data
// @route   GET /api/import-export/export-module
// @access  Private
exports.exportModuleData = async (req, res) => {
  try {
    const { module = 'customers', format = 'xlsx' } = req.query;
    const workbook = XLSX.utils.book_new();

    let sheetName = 'Export';
    let data = [];

    switch (module) {
      case 'calls': {
        sheetName = 'Call_History';
        const q = req.user.role === 'admin' ? {} : { userId: req.user._id };
        const calls = await CallHistory.find(q).sort({ callDate: -1 });
        data = calls.map((cl, i) => ({
          'S.No': i + 1,
          'Date & Time': new Date(cl.callDate).toLocaleString(),
          'Customer Name': cl.customerName,
          'Mobile Number': cl.mobileNumber,
          'Sales Rep': cl.employeeName,
          'Outcome': cl.callResult,
          'Notes': cl.callNotes,
          'Next Action': cl.nextAction,
          'Status': cl.statusAfterCall,
        }));
        break;
      }
      case 'targets': {
        sheetName = 'Sales_Targets';
        const targets = await Target.find().sort({ month: -1 });
        data = targets.map((t, i) => ({
          'S.No': i + 1,
          'Month': t.month,
          'Employee': t.employeeName,
          'Monthly Leads': t.monthlyLeadTarget,
          'Daily Leads': t.dailyLeadTarget,
          'Monthly Calls': t.monthlyCallTarget,
          'Daily Calls': t.dailyCallTarget,
          'Monthly Conversions': t.monthlyConversionTarget,
          'Notes': t.notes,
        }));
        break;
      }
      case 'reports': {
        sheetName = 'Daily_Reports';
        const q = req.user.role === 'admin' ? {} : { userId: req.user._id };
        const reports = await DailyReport.find(q).sort({ date: -1 });
        data = reports.map((r, i) => ({
          'S.No': i + 1,
          'Date': new Date(r.date).toLocaleDateString(),
          'Employee': r.employeeName,
          'Attendance': r.attendanceStatus,
          'Clock In': r.clockInTime,
          'Clock Out': r.clockOutTime,
          'Calls Done': r.customersContacted,
          'Follow-ups Done': r.followupsCompleted,
          'Leads Added': r.newLeadsAdded,
          'Conversions': r.dealsConverted,
          'Remarks': r.remarks,
        }));
        break;
      }
      case 'logs': {
        sheetName = 'Activity_Logs';
        const logs = await ActivityLog.find().sort({ createdAt: -1 });
        data = logs.map((l, i) => ({
          'S.No': i + 1,
          'Timestamp': new Date(l.createdAt).toLocaleString(),
          'User': l.userName,
          'Role': l.userRole,
          'Action': l.action,
          'Details': l.details,
        }));
        break;
      }
      case 'employees': {
        sheetName = 'Employees';
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        data = users.map((u, i) => ({
          'S.No': i + 1,
          'Name': u.name,
          'Email': u.email,
          'Phone': u.phone,
          'Designation': u.designation,
          'Role': u.role,
          'Status': u.status,
          'Joined': new Date(u.createdAt).toLocaleDateString(),
        }));
        break;
      }
      default: {
        return exports.exportCustomers(req, res);
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (format === 'csv') {
      const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'buffer' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_${Date.now()}.csv`);
      return res.send(csvBuffer);
    } else {
      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_${Date.now()}.xlsx`);
      return res.send(xlsxBuffer);
    }
  } catch (error) {
    console.error('exportModuleData error:', error);
    res.status(500).json({ success: false, message: 'Failed to export module data.' });
  }
};

// @desc    Download import template
// @route   GET /api/import-export/template
// @access  Private (Admin only)
exports.getImportTemplate = (req, res) => {
  try {
    const templateData = [
      {
        'Customer Name*': 'Rahul Verma',
        'Business / Company Name*': 'SofaShine',
        'Priority': 'Hot',
        'Mobile Number*': '9876543210',
        'Alternate Mobile': '9876543211',
        'Email': 'rahul@example.com',
        'Location*': 'Cyber City',
        'City*': 'Gurgaon',
        'State*': 'Haryana',
        'Full Address': 'Tower 4, 5th Floor, Cyber City',
        'Product / Service*': 'Sofa Deep Cleaning',
        'Lead Source*': 'Website',
        'Requirement': '3+2 sofa dry cleaning and sanitization',
        'Follow-up Date*': '2026-09-15',
        'Follow-up Time': '02:30 PM',
        'Follow-up Status*': 'Interested',
        'Remarks': 'Weekend appointment requested',
        'Sales Employee Email': 'priya@crm.com',
      },
      {
        'Customer Name*': 'Amit Kumar',
        'Business / Company Name*': 'CleanCruisers',
        'Priority': 'Warm',
        'Mobile Number*': '9876543299',
        'Alternate Mobile': '',
        'Email': 'amit@example.com',
        'Location*': 'Indiranagar',
        'City*': 'Bangalore',
        'State*': 'Karnataka',
        'Full Address': '100 Feet Road, Indiranagar',
        'Product / Service*': 'Car Detailing & Interior Cleaning',
        'Lead Source*': 'Google Ads',
        'Requirement': 'SUV complete interior foam wash and ceramic coat',
        'Follow-up Date*': '2026-09-16',
        'Follow-up Time': '11:00 AM',
        'Follow-up Status*': 'New Lead',
        'Remarks': 'Needs doorstep car wash package',
        'Sales Employee Email': 'rahul@crm.com',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CustomerTemplate');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate template.' });
  }
};

// @desc    Import customers from Excel or CSV
// @route   POST /api/import-export/import
// @access  Private (Admin only)
exports.importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty.' });
    }

    const allUsers = await User.find();
    const userMapByEmail = new Map();
    const userMapByName = new Map();
    allUsers.forEach((u) => {
      userMapByEmail.set(u.email.toLowerCase(), u);
      userMapByName.set(u.name.toLowerCase(), u);
    });

    const existingMobiles = new Set(
      (await Customer.find({}, { mobileNumber: 1 })).map((c) => c.mobileNumber)
    );

    const successfulRows = [];
    const skippedDuplicates = [];
    const invalidRows = [];

    const defaultEmployee = req.user;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2;

      const customerName = row['Customer Name*'] || row['Customer Name'] || row['customerName'] || row['Name'];
      const rawCompany = (row['Business / Company Name*'] || row['Company Name'] || row['companyName'] || row['Company'] || row['Business'] || '').toString().trim();
      const companyName = /cleancruiser/i.test(rawCompany) ? 'CleanCruisers' : 'SofaShine';
      const rawPriority = (row['Priority'] || row['priority'] || 'Warm').toString().trim();
      const priority = ['Hot', 'Warm', 'Cold'].includes(rawPriority) ? rawPriority : 'Warm';

      let mobileNumber = (row['Mobile Number*'] || row['Mobile Number'] || row['mobileNumber'] || row['Mobile'] || '').toString().trim();
      const altMobileNumber = (row['Alternate Mobile'] || row['altMobileNumber'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim();
      const location = row['Location*'] || row['Location'] || row['location'] || 'Head Office';
      const city = row['City*'] || row['City'] || row['city'] || 'Metropolis';
      const state = row['State*'] || row['State'] || row['state'] || 'State';
      const fullAddress = row['Full Address'] || row['Address'] || row['fullAddress'] || '';
      const productInterested = row['Product / Service*'] || row['Product'] || row['productInterested'] || 'General Enquiry';
      const leadSource = row['Lead Source*'] || row['Lead Source'] || row['leadSource'] || 'Website';
      const customerRequirement = row['Requirement'] || row['customerRequirement'] || '';
      const rawFollowUpDate = row['Follow-up Date*'] || row['Follow-up Date'] || row['followUpDate'];
      const followUpTime = (row['Follow-up Time'] || row['followUpTime'] || '11:00 AM').toString().trim();
      const rawFollowUpStatus = row['Follow-up Status*'] || row['Follow-up Status'] || row['followUpStatus'] || 'New Lead';
      const remarks = row['Remarks'] || row['remarks'] || '';
      const assignedEmailOrName = (row['Sales Employee Email'] || row['Sales Employee'] || '').toString().trim();

      if (!customerName || !mobileNumber) {
        invalidRows.push({ row: rowNumber, reason: 'Customer Name and Mobile Number are required.' });
        continue;
      }

      if (existingMobiles.has(mobileNumber)) {
        skippedDuplicates.push({ row: rowNumber, customerName, mobileNumber, reason: 'Mobile number already exists in CRM' });
        continue;
      }

      let assignedUser = defaultEmployee;
      if (assignedEmailOrName) {
        const found = userMapByEmail.get(assignedEmailOrName.toLowerCase()) || userMapByName.get(assignedEmailOrName.toLowerCase());
        if (found) assignedUser = found;
      }

      let followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 3);
      if (rawFollowUpDate) {
        const parsed = new Date(rawFollowUpDate);
        if (!isNaN(parsed.getTime())) {
          followUpDate = parsed;
        }
      }

      const validStatuses = ['New Lead', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 'Converted', 'Lost'];
      const validSources = ['Website', 'Cold Call', 'Referral', 'LinkedIn', 'Google Ads', 'Walk-in', 'Email Campaign', 'Exhibition', 'Other'];
      const followUpStatus = validStatuses.includes(rawFollowUpStatus) ? rawFollowUpStatus : 'New Lead';

      const newCustomer = {
        date: new Date(),
        customerName,
        companyName,
        priority,
        mobileNumber,
        altMobileNumber,
        email,
        location,
        city,
        state,
        fullAddress,
        productInterested,
        leadSource: validSources.includes(leadSource) ? leadSource : 'Website',
        customerRequirement,
        followUpDate,
        followUpTime,
        followUpStatus,
        remarks,
        salesEmployeeName: assignedUser.name,
        createdByEmployeeId: assignedUser._id,
        lastUpdatedBy: req.user._id,
        timeline: [
          {
            action: 'IMPORTED',
            description: `Imported via Excel spreadsheet by ${req.user.name}`,
            performedBy: req.user._id,
            performerName: req.user.name,
            timestamp: new Date(),
          },
        ],
        documents: [],
      };

      successfulRows.push(newCustomer);
      existingMobiles.add(mobileNumber);
    }

    if (successfulRows.length > 0) {
      await Customer.insertMany(successfulRows);
    }

    await createLog({
      user: req.user,
      action: 'IMPORT_CUSTOMERS',
      details: `Admin imported ${successfulRows.length} customers (${skippedDuplicates.length} duplicates skipped, ${invalidRows.length} invalid).`,
    });

    res.status(200).json({
      success: true,
      message: `Import processed: ${successfulRows.length} imported successfully, ${skippedDuplicates.length} duplicates skipped, ${invalidRows.length} invalid rows.`,
      summary: {
        totalRows: rawRows.length,
        importedCount: successfulRows.length,
        duplicatesCount: skippedDuplicates.length,
        invalidCount: invalidRows.length,
        skippedDuplicates,
        invalidRows,
      },
    });
  } catch (error) {
    console.error('importCustomers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process import file.',
    });
  }
};

require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const User = require('../models/User');
const Customer = require('../models/Customer');
const CallHistory = require('../models/CallHistory');
const Target = require('../models/Target');
const DailyReport = require('../models/DailyReport');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sales_crm';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await CallHistory.deleteMany({});
    await Target.deleteMany({});
    await DailyReport.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleared all previous test collections.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@crm.com',
      password: 'Admin@123',
      phone: '+91 98765 43210',
      designation: 'Sales Operations Director',
      role: 'admin',
      status: 'approved',
      avatarColor: '#4f46e5',
    });

    // 2. Create Approved Employees
    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@crm.com',
      password: 'Sales@123',
      phone: '+91 98123 45678',
      designation: 'Senior Enterprise Sales Lead',
      role: 'employee',
      status: 'approved',
      avatarColor: '#ec4899',
    });

    const rahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@crm.com',
      password: 'Sales@123',
      phone: '+91 98234 56789',
      designation: 'Key Account Executive',
      role: 'employee',
      status: 'approved',
      avatarColor: '#3b82f6',
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'john@crm.com',
      password: 'Sales@123',
      phone: '+91 98345 67890',
      designation: 'Regional Sales Executive',
      role: 'employee',
      status: 'approved',
      avatarColor: '#10b981',
    });

    const sarah = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@crm.com',
      password: 'Sales@123',
      phone: '+91 98456 78901',
      designation: 'SMB Growth Specialist',
      role: 'employee',
      status: 'approved',
      avatarColor: '#f59e0b',
    });

    const amit = await User.create({
      name: 'Amit Patel',
      email: 'amit@crm.com',
      password: 'Sales@123',
      phone: '+91 98567 89012',
      designation: 'Inside Sales Trainee',
      role: 'employee',
      status: 'pending',
      avatarColor: '#8b5cf6',
    });

    console.log('Users created successfully.');

    // Date helpers
    const daysAgo = (d) => {
      const date = new Date();
      date.setDate(date.getDate() - d);
      return date;
    };

    const daysFromNow = (d) => {
      const date = new Date();
      date.setDate(date.getDate() + d);
      return date;
    };

    // 3. Create Sample Customers
    const rawCustomers = [
      {
        date: daysAgo(10),
        customerName: 'Aarav Sharma',
        companyName: 'SofaShine',
        priority: 'Hot',
        mobileNumber: '9811122233',
        altMobileNumber: '0112345678',
        email: 'aarav.sharma@gmail.com',
        location: 'Cyber City, Phase 3',
        fullAddress: 'Tower B, 7th Floor, DLF Cyber City, Sector 24',
        city: 'Gurgaon',
        state: 'Haryana',
        productInterested: 'Sofa & Fabric Deep Cleaning',
        leadSource: 'Website',
        customerRequirement: 'Looking for 7-seater velvet sofa deep steam cleaning and stain protection.',
        followUpDate: daysFromNow(1),
        followUpTime: '11:30 AM',
        followUpStatus: 'Interested',
        remarks: 'Sent pricing quotation of Rs 4,500. Review meeting scheduled for tomorrow.',
        salesEmployeeName: priya.name,
        createdByEmployeeId: priya._id,
        documents: [
          {
            fileName: 'doc_quotation_aarav.pdf',
            originalName: 'Quotation_SofaDeepClean_Aarav.pdf',
            fileUrl: '/uploads/documents/sample_quote.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            docType: 'Quotation',
            uploadedBy: priya._id,
            uploaderName: priya.name,
            uploadedAt: daysAgo(8),
          },
        ],
        timeline: [
          {
            action: 'CREATED',
            description: 'Customer registered via website inbound lead form',
            performerName: priya.name,
            timestamp: daysAgo(10),
          },
          {
            action: 'CALL_LOGGED',
            description: 'Call connected: Client confirmed 7-seater size. Requested quotation.',
            performerName: priya.name,
            timestamp: daysAgo(9),
          },
          {
            action: 'DOC_UPLOADED',
            description: 'Uploaded Quotation: "Quotation_SofaDeepClean_Aarav.pdf"',
            performerName: priya.name,
            timestamp: daysAgo(8),
          },
        ],
      },
      {
        date: daysAgo(25),
        customerName: 'Vikram Singhania',
        companyName: 'CleanCruisers',
        priority: 'Hot',
        mobileNumber: '9822233344',
        altMobileNumber: '',
        email: 'vikram.singhania@corp.in',
        location: 'Bandra Kurla Complex (BKC)',
        fullAddress: 'C-59, G Block, BKC, Bandra East',
        city: 'Mumbai',
        state: 'Maharashtra',
        productInterested: 'Fleet Car Detailing & Sanitization',
        leadSource: 'Referral',
        customerRequirement: 'Monthly recurring detailing contract for 12 executive sedans and SUVs.',
        followUpDate: daysAgo(2), // OVERDUE FOLLOW-UP
        followUpTime: '02:00 PM',
        followUpStatus: 'Follow-up',
        remarks: 'OVERDUE: Final agreement draft pending approval from finance director.',
        salesEmployeeName: priya.name,
        createdByEmployeeId: priya._id,
        timeline: [
          {
            action: 'CREATED',
            description: 'Fleet enquiry received through corporate referral',
            performerName: priya.name,
            timestamp: daysAgo(25),
          },
          {
            action: 'STATUS_CHANGE',
            description: 'Status updated to "Follow-up" after on-site fleet inspection',
            performerName: priya.name,
            timestamp: daysAgo(15),
          },
        ],
      },
      {
        date: daysAgo(5),
        customerName: 'Neha Kapoor',
        companyName: 'SofaShine',
        priority: 'Warm',
        mobileNumber: '9833344455',
        altMobileNumber: '9833344499',
        email: 'neha.kapoor@outlook.com',
        location: 'Koramangala 4th Block',
        fullAddress: '#412, 80 Feet Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        productInterested: 'Luxury Leather Sofa Restoration',
        leadSource: 'Google Ads',
        customerRequirement: 'Leather conditioning, scratch repair, and foam restoration for 5-piece Italian set.',
        followUpDate: new Date(), // DUE TODAY
        followUpTime: '03:30 PM',
        followUpStatus: 'Contacted',
        remarks: 'Scheduled consultation call today at 3:30 PM.',
        salesEmployeeName: priya.name,
        createdByEmployeeId: priya._id,
        timeline: [
          {
            action: 'CREATED',
            description: 'Google Ads landing page submission',
            performerName: priya.name,
            timestamp: daysAgo(5),
          },
        ],
      },
      {
        date: daysAgo(40),
        customerName: 'Kunal Malhotra',
        companyName: 'SofaShine',
        priority: 'Warm',
        mobileNumber: '9844455566',
        altMobileNumber: '',
        email: 'kunal.m@technovate.io',
        location: 'Hitec City',
        fullAddress: 'Plot 12, Mindspace IT Park, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        productInterested: 'Office Lounge Chairs & Carpet Cleaning',
        leadSource: 'LinkedIn',
        customerRequirement: 'Deep carpet shampooing across 15,000 sq ft office floor + 40 workstation chairs.',
        followUpDate: daysAgo(15),
        followUpTime: '10:00 AM',
        followUpStatus: 'Converted',
        remarks: 'Deal closed! PO issued for Rs 85,000. Annual maintenance contract active.',
        salesEmployeeName: priya.name,
        createdByEmployeeId: priya._id,
        timeline: [
          {
            action: 'CREATED',
            description: 'Corporate enquiry via LinkedIn Campaign',
            performerName: priya.name,
            timestamp: daysAgo(40),
          },
          {
            action: 'STATUS_CHANGE',
            description: 'Deal WON & CONVERTED - Rs 85,000 AMC',
            performerName: priya.name,
            timestamp: daysAgo(15),
          },
        ],
      },
      {
        date: daysAgo(12),
        customerName: 'Ananya Deshmukh',
        companyName: 'CleanCruisers',
        priority: 'Hot',
        mobileNumber: '9855566677',
        altMobileNumber: '',
        email: 'ananya.d@puneventures.com',
        location: 'Koregaon Park',
        fullAddress: 'Lane 7, Koregaon Park North',
        city: 'Pune',
        state: 'Maharashtra',
        productInterested: 'Ceramic Coating & Paint Protection',
        leadSource: 'Walk-in',
        customerRequirement: '9H Ceramic coating for newly delivered German SUV.',
        followUpDate: daysFromNow(3),
        followUpTime: '01:00 PM',
        followUpStatus: 'Interested',
        remarks: 'Customer interested in 3-year warranty package. Visiting detailing studio on Saturday.',
        salesEmployeeName: rahul.name,
        createdByEmployeeId: rahul._id,
      },
      {
        date: daysAgo(8),
        customerName: 'Rohan Mehra',
        companyName: 'CleanCruisers',
        priority: 'Cold',
        mobileNumber: '9866677788',
        altMobileNumber: '',
        email: 'rohan.mehra@rediffmail.com',
        location: 'Salt Lake Sector V',
        fullAddress: 'Block EP & GP, Sector V, Bidhannagar',
        city: 'Kolkata',
        state: 'West Bengal',
        productInterested: 'Basic Car Foam Wash',
        leadSource: 'Cold Call',
        customerRequirement: 'Single exterior foam wash enquiry.',
        followUpDate: daysAgo(4), // Overdue
        followUpTime: '12:00 PM',
        followUpStatus: 'Not Interested',
        remarks: 'Client prefers local neighborhood washing center due to price point.',
        salesEmployeeName: rahul.name,
        createdByEmployeeId: rahul._id,
      },
      {
        date: daysAgo(2),
        customerName: 'Pooja Hegde',
        companyName: 'SofaShine',
        priority: 'Hot',
        mobileNumber: '9877788899',
        altMobileNumber: '',
        email: 'pooja.hegde@gmail.com',
        location: 'Anna Nagar West',
        fullAddress: '2nd Avenue, Block C, Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        productInterested: 'Dining Chairs & Recliner Deep Clean',
        leadSource: 'Website',
        customerRequirement: '8 dining chairs + 2 motorized leather recliners cleaning.',
        followUpDate: new Date(), // DUE TODAY
        followUpTime: '05:00 PM',
        followUpStatus: 'New Lead',
        remarks: 'Fresh lead received yesterday. Call scheduled for today evening.',
        salesEmployeeName: rahul.name,
        createdByEmployeeId: rahul._id,
      },
      {
        date: daysAgo(14),
        customerName: 'Deepak Joshi',
        companyName: 'CleanCruisers',
        priority: 'Warm',
        mobileNumber: '9888899900',
        altMobileNumber: '',
        email: 'deepak.joshi@shoppex.com',
        location: 'Navrangpura',
        fullAddress: 'Opposite Gujarat University, Navrangpura',
        city: 'Ahmedabad',
        state: 'Gujarat',
        productInterested: 'Interior Odor Removal & Sanitization',
        leadSource: 'Google Ads',
        customerRequirement: 'Ozone treatment and dry extraction for smoke odor in used car.',
        followUpDate: daysFromNow(5),
        followUpTime: '04:00 PM',
        followUpStatus: 'Converted',
        remarks: 'Service completed successfully. Customer gave 5-star rating.',
        salesEmployeeName: john.name,
        createdByEmployeeId: john._id,
      },
      {
        date: daysAgo(3),
        customerName: 'Meera Nambiar',
        companyName: 'SofaShine',
        priority: 'Hot',
        mobileNumber: '9899900011',
        altMobileNumber: '',
        email: 'meera.nambiar@gmail.com',
        location: 'Marine Drive',
        fullAddress: 'Bayview Towers, Flat 14A, Marine Drive',
        city: 'Kochi',
        state: 'Kerala',
        productInterested: 'Mattress & Sofa Sanitization',
        leadSource: 'Referral',
        customerRequirement: 'Allergen UV sanitization for 3 king-size mattresses and L-shaped sectional sofa.',
        followUpDate: daysFromNow(2),
        followUpTime: '11:00 AM',
        followUpStatus: 'Follow-up',
        remarks: 'Quotation shared on WhatsApp. Follow up on Thursday for slot booking.',
        salesEmployeeName: sarah.name,
        createdByEmployeeId: sarah._id,
      },
    ];

    const createdCustomers = await Customer.insertMany(rawCustomers);
    console.log(`Seeded ${createdCustomers.length} customer records.`);

    // 4. Create Call History logs
    const callLogs = [
      {
        customerId: createdCustomers[0]._id,
        customerName: createdCustomers[0].customerName,
        mobileNumber: createdCustomers[0].mobileNumber,
        userId: priya._id,
        salesEmployeeName: priya.name,
        callDate: daysAgo(9),
        callTime: '11:30 AM',
        callResult: 'Connected',
        nextAction: 'Send detailed PDF quotation',
        remarks: 'Client is friendly and has a 7-seater velvet sofa with minor coffee stains. Agreed to review quotation.',
        newStatus: 'Interested',
      },
      {
        customerId: createdCustomers[1]._id,
        customerName: createdCustomers[1].customerName,
        mobileNumber: createdCustomers[1].mobileNumber,
        userId: priya._id,
        salesEmployeeName: priya.name,
        callDate: daysAgo(15),
        callTime: '02:15 PM',
        callResult: 'Connected',
        nextAction: 'Meet with corporate fleet manager',
        remarks: 'Discussed volume discount for 12 corporate fleet vehicles. Awaiting board clearance.',
        newStatus: 'Follow-up',
      },
      {
        customerId: createdCustomers[2]._id,
        customerName: createdCustomers[2].customerName,
        mobileNumber: createdCustomers[2].mobileNumber,
        userId: priya._id,
        salesEmployeeName: priya.name,
        callDate: daysAgo(4),
        callTime: '04:45 PM',
        callResult: 'Busy',
        nextAction: 'Call back next day afternoon',
        remarks: 'Client was in an executive meeting. Requested callback.',
        newStatus: 'Contacted',
      },
      {
        customerId: createdCustomers[4]._id,
        customerName: createdCustomers[4].customerName,
        mobileNumber: createdCustomers[4].mobileNumber,
        userId: rahul._id,
        salesEmployeeName: rahul.name,
        callDate: daysAgo(10),
        callTime: '01:00 PM',
        callResult: 'Connected',
        nextAction: 'Send sample photos of 9H ceramic coating on WhatsApp',
        remarks: 'Client wants gloss enhancement on Audi Q7. Shared before/after gallery.',
        newStatus: 'Interested',
      },
      {
        customerId: createdCustomers[5]._id,
        customerName: createdCustomers[5].customerName,
        mobileNumber: createdCustomers[5].mobileNumber,
        userId: rahul._id,
        salesEmployeeName: rahul.name,
        callDate: daysAgo(4),
        callTime: '12:00 PM',
        callResult: 'Connected',
        nextAction: 'Close lead',
        remarks: 'Customer declined service, price conscious.',
        newStatus: 'Not Interested',
      },
    ];

    await CallHistory.insertMany(callLogs);
    console.log(`Seeded ${callLogs.length} call history interaction logs.`);

    // 5. Create Monthly Targets
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const targets = [
      {
        userId: priya._id,
        employeeName: priya.name,
        month: currentMonth,
        dailyLeadTarget: 6,
        monthlyLeadTarget: 120,
        monthlyConversionTarget: 25,
        dailyCallTarget: 30,
        assignedBy: admin._id,
        assignedByName: admin.name,
        notes: 'Q3 Enterprise push for SofaShine corporate accounts.',
      },
      {
        userId: rahul._id,
        employeeName: rahul.name,
        month: currentMonth,
        dailyLeadTarget: 5,
        monthlyLeadTarget: 100,
        monthlyConversionTarget: 20,
        dailyCallTarget: 25,
        assignedBy: admin._id,
        assignedByName: admin.name,
        notes: 'Focus on CleanCruisers ceramic coating packages.',
      },
      {
        userId: john._id,
        employeeName: john.name,
        month: currentMonth,
        dailyLeadTarget: 5,
        monthlyLeadTarget: 90,
        monthlyConversionTarget: 18,
        dailyCallTarget: 25,
        assignedBy: admin._id,
        assignedByName: admin.name,
      },
      {
        userId: sarah._id,
        employeeName: sarah.name,
        month: currentMonth,
        dailyLeadTarget: 4,
        monthlyLeadTarget: 80,
        monthlyConversionTarget: 15,
        dailyCallTarget: 20,
        assignedBy: admin._id,
        assignedByName: admin.name,
      },
    ];

    await Target.insertMany(targets);
    console.log(`Seeded targets for sales team.`);

    // 6. Create Daily Reports / Attendance
    const dailyReports = [
      {
        userId: priya._id,
        employeeName: priya.name,
        date: daysAgo(1),
        attendanceStatus: 'Present',
        clockInTime: '09:15 AM',
        clockOutTime: '06:30 PM',
        customersContacted: 18,
        followupsCompleted: 8,
        newLeadsAdded: 4,
        dealsConverted: 1,
        remarks: 'Sent 3 quotations for commercial cleaning; 1 high-value conversion closed.',
      },
      {
        userId: rahul._id,
        employeeName: rahul.name,
        date: daysAgo(1),
        attendanceStatus: 'Present',
        clockInTime: '09:30 AM',
        clockOutTime: '06:15 PM',
        customersContacted: 14,
        followupsCompleted: 6,
        newLeadsAdded: 3,
        dealsConverted: 0,
        remarks: 'Focused on inbound leads from Ahmedabad and Pune regions.',
      },
    ];

    await DailyReport.insertMany(dailyReports);
    console.log('Seeded daily attendance & work reports.');

    // 7. Create Notifications
    const notifications = [
      {
        recipientId: priya._id,
        recipientRole: 'employee',
        title: '⚠️ Overdue Follow-up Alert',
        message: 'Follow-up with Vikram Singhania (CleanCruisers) was due on 2 days ago. Please reach out.',
        type: 'overdue',
        link: '/employee/customers',
        isRead: false,
      },
      {
        recipientId: priya._id,
        recipientRole: 'employee',
        title: '📅 Follow-up Due Today',
        message: 'You have a scheduled follow-up call with Neha Kapoor today at 03:30 PM.',
        type: 'followup',
        link: '/employee/customers',
        isRead: false,
      },
      {
        recipientId: rahul._id,
        recipientRole: 'employee',
        title: '🎯 Monthly Targets Assigned',
        message: `Your targets for ${currentMonth} have been published by Admin (100 leads, 20 conversions).`,
        type: 'target',
        link: '/employee/dashboard',
        isRead: false,
      },
      {
        recipientRole: 'admin',
        title: '👤 New Employee Awaiting Approval',
        message: 'Amit Patel (Inside Sales Trainee) has registered and requires account verification.',
        type: 'approval',
        link: '/admin/employees',
        isRead: false,
      },
    ];

    await Notification.insertMany(notifications);
    console.log('Seeded role-based notifications.');

    // 8. Create Activity Logs
    const initialLogs = [
      {
        user: admin._id,
        userName: admin.name,
        userRole: 'admin',
        action: 'ASSIGN_TARGET',
        details: 'Assigned monthly sales targets to Priya Sharma and Rahul Verma.',
      },
      {
        user: priya._id,
        userName: priya.name,
        userRole: 'employee',
        action: 'LOG_CALL',
        details: 'Recorded call interaction with Aarav Sharma (Quotation Sent).',
      },
      {
        user: priya._id,
        userName: priya.name,
        userRole: 'employee',
        action: 'SUBMIT_DAILY_REPORT',
        details: 'Submitted daily work report (18 calls, 4 leads added).',
      },
    ];

    await ActivityLog.insertMany(initialLogs);
    console.log('Seeded activity audit logs.');

    console.log('========================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY WITH 15 ADVANCED FEATURES!');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();

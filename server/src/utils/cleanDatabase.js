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

const cleanDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sales_crm';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected for complete data cleanup...');

    // 1. Clear all customer leads
    const delCust = await Customer.deleteMany({});
    console.log(`Deleted ${delCust.deletedCount} dummy customers.`);

    // 2. Clear call logs
    const delCalls = await CallHistory.deleteMany({});
    console.log(`Deleted ${delCalls.deletedCount} dummy call logs.`);

    // 3. Clear targets
    const delTargets = await Target.deleteMany({});
    console.log(`Deleted ${delTargets.deletedCount} dummy targets.`);

    // 4. Clear daily work reports
    const delReports = await DailyReport.deleteMany({});
    console.log(`Deleted ${delReports.deletedCount} dummy daily work reports.`);

    // 5. Clear notifications
    const delNotifs = await Notification.deleteMany({});
    console.log(`Deleted ${delNotifs.deletedCount} dummy notifications.`);

    // 6. Clear activity logs
    const delLogs = await ActivityLog.deleteMany({});
    console.log(`Deleted ${delLogs.deletedCount} dummy activity audit logs.`);

    // 7. Clear all users
    const delUsers = await User.deleteMany({});
    console.log(`Deleted ${delUsers.deletedCount} previous users.`);

    // 8. Create single official System Administrator account
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'cleancruisers.in@gmail.com',
      password: 'Admin@123',
      phone: '9876543210',
      role: 'admin',
      designation: 'Chief Administrator',
      status: 'approved',
      avatarColor: '#4f46e5',
    });

    console.log('========================================');
    console.log('✅ DATABASE 100% CLEANED & PRODUCTION READY!');
    console.log('========================================');
    console.log(`👑 ADMIN CREDENTIALS:`);
    console.log(`📧 Email: cleancruisers.in@gmail.com`);
    console.log(`🔑 Password: Admin@123`);
    console.log(`🛡️ Role: admin (Approved)`);
    console.log('========================================');
    console.log('👥 Employee Panel is clean. New workers can now register via Signup with valid emails and get approved by Admin.');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();

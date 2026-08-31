require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const User = require('../models/User');

const updateAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sales_crm';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB...');

    // Find admin and update email
    let admin = await User.findOne({ role: 'admin' });
    if (admin) {
      admin.email = 'cleancruisers.in@gmail.com';
      await admin.save();
      console.log(`Updated Admin email to: ${admin.email}`);
    } else {
      admin = await User.create({
        name: 'System Administrator',
        email: 'cleancruisers.in@gmail.com',
        password: 'Admin@123',
        phone: '9876543210',
        role: 'admin',
        designation: 'Chief Administrator',
        status: 'approved',
        avatarColor: '#4f46e5',
      });
      console.log(`Created new Admin with email: ${admin.email}`);
    }

    console.log('✅ Admin credentials updated successfully to cleancruisers.in@gmail.com');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();

const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Half Day', 'Leave', 'Work From Home'],
      default: 'Present',
    },
    clockInTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    clockOutTime: {
      type: String,
      default: '',
    },
    customersContacted: {
      type: Number,
      default: 0,
      min: 0,
    },
    followupsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    newLeadsAdded: {
      type: Number,
      default: 0,
      min: 0,
    },
    dealsConverted: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

dailyReportSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);

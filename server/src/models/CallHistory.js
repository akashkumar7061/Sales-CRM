const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      default: 'Customer',
    },
    mobileNumber: {
      type: String,
      required: true,
      default: '',
    },
    companyName: {
      type: String,
      default: 'SofaShine',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    salesEmployeeName: {
      type: String,
      required: true,
      default: 'Sales Executive',
    },
    callDate: {
      type: Date,
      default: Date.now,
    },
    callTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    callResult: {
      type: String,
      default: 'Connected',
    },
    nextAction: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: 'Customer call discussion recorded',
    },
    newStatus: {
      type: String,
      default: '',
    },
    newFollowUpDate: {
      type: Date,
    },
    newFollowUpTime: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    recordingFileName: {
      type: String,
      default: '',
    },
    recordingFileSize: {
      type: Number,
      default: 0,
    },
    recordingMimeType: {
      type: String,
      default: '',
    },
    recordingDuration: {
      type: String,
      default: '',
    },
    hasRecording: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

callHistorySchema.index({ customerId: 1, createdAt: -1 });
callHistorySchema.index({ hasRecording: 1, createdAt: -1 });
callHistorySchema.index({ userId: 1, hasRecording: 1, createdAt: -1 });

module.exports = mongoose.model('CallHistory', callHistorySchema);

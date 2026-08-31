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
    },
    mobileNumber: {
      type: String,
      required: true,
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
    },
    callDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    callTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    callResult: {
      type: String,
      required: [true, 'Call result is required'],
      enum: [
        'Connected',
        'Busy',
        'No Answer',
        'Wrong Number',
        'Voicemail',
        'Call Back Later',
      ],
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
      required: [true, 'Call notes / remarks are required'],
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
    },
  },
  {
    timestamps: true,
  }
);

callHistorySchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('CallHistory', callHistorySchema);

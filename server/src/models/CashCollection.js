const mongoose = require('mongoose');

const CashCollectionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      index: true,
      required: [true, 'Collection date is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    employeeName: {
      type: String,
      required: [true, 'Worker/Employee name is required'],
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Collected amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Deposit', 'Cheque', 'Other'],
      default: 'Cash',
    },
    companyName: {
      type: String,
      enum: ['SofaShine', 'CleanCruisers'],
      default: 'SofaShine',
    },
    customerReference: {
      type: String,
      trim: true,
      default: '',
    },
    receiptNo: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Received', 'Verified', 'Pending'],
      default: 'Received',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    collectedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    collectedByAdminName: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

CashCollectionSchema.index({ date: -1, employeeId: 1 });
CashCollectionSchema.index({ companyName: 1, paymentMode: 1 });

module.exports = mongoose.model('CashCollection', CashCollectionSchema);

const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema(
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
    month: {
      type: String, // format: "YYYY-MM" e.g. "2026-08"
      required: true,
      index: true,
    },
    dailyLeadTarget: {
      type: Number,
      default: 5,
      min: 0,
    },
    monthlyLeadTarget: {
      type: Number,
      default: 100,
      min: 0,
    },
    dailyCallTarget: {
      type: Number,
      default: 25,
      min: 0,
    },
    monthlyCallTarget: {
      type: Number,
      default: 500,
      min: 0,
    },
    dailyConversionTarget: {
      type: Number,
      default: 1,
      min: 0,
    },
    monthlyConversionTarget: {
      type: Number,
      default: 20,
      min: 0,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedByName: {
      type: String,
      default: 'Admin',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

targetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Target', targetSchema);

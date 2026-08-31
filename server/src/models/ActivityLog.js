const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_CUSTOMER',
        'UPDATE_CUSTOMER',
        'DELETE_CUSTOMER',
        'REASSIGN_CUSTOMER',
        'APPROVE_EMPLOYEE',
        'REJECT_EMPLOYEE',
        'UPDATE_EMPLOYEE',
        'STATUS_CHANGE_EMPLOYEE',
        'DELETE_EMPLOYEE',
        'IMPORT_CUSTOMERS',
        'EXPORT_CUSTOMERS',
        'LOG_CALL',
        'ASSIGN_TARGET',
        'SUBMIT_DAILY_REPORT',
        'UPLOAD_DOCUMENT',
        'DELETE_DOCUMENT',
        'LOGIN',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

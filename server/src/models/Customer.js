const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  docType: {
    type: String,
    enum: ['ID Proof', 'Quotation', 'Invoice', 'Agreement', 'Payment Proof', 'Other'],
    default: 'Other',
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderName: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
});

const timelineItemSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'CREATED', 'STATUS_CHANGE', 'CALL_LOGGED', 'DOC_UPLOADED', 'REASSIGNED'
  description: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performerName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

const customerSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company / Business name is required'],
      enum: ['SofaShine', 'CleanCruisers'],
      default: 'SofaShine',
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    altMobileNumber: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    fullAddress: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    productInterested: {
      type: String,
      required: [true, 'Product/Service interested in is required'],
      trim: true,
    },
    leadSource: {
      type: String,
      required: [true, 'Lead source is required'],
      enum: [
        'Website',
        'Cold Call',
        'Referral',
        'LinkedIn',
        'Google Ads',
        'Walk-in',
        'Email Campaign',
        'Exhibition',
        'Other',
      ],
      default: 'Website',
    },
    priority: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold'],
      default: 'Warm',
      index: true,
    },
    customerRequirement: {
      type: String,
      trim: true,
      default: '',
    },
    followUpDate: {
      type: Date,
      required: [true, 'Follow-up date is required'],
    },
    followUpTime: {
      type: String,
      default: '11:00 AM',
      trim: true,
    },
    followUpStatus: {
      type: String,
      required: [true, 'Follow-up status is required'],
      enum: [
        'New Lead',
        'Contacted',
        'Interested',
        'Not Interested',
        'Follow-up',
        'Converted',
        'Lost',
      ],
      default: 'New Lead',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    salesEmployeeName: {
      type: String,
      required: [true, 'Sales employee name is required'],
      trim: true,
    },
    createdByEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    documents: [documentSchema],
    timeline: [timelineItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to help search queries
customerSchema.index({ customerName: 'text', companyName: 'text', mobileNumber: 'text', location: 'text', city: 'text' });

module.exports = mongoose.model('Customer', customerSchema);


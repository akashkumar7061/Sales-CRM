const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  checkDuplicateMobile,
  uploadCustomerDocument,
  deleteCustomerDocument,
} = require('../controllers/customerController');
const { protect, approvedOnly } = require('../middleware/auth');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const recordingsDir = path.join(__dirname, '../uploads/recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Multer storage configuration for documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `doc_${Date.now()}_${safeName}${ext}`);
  },
});

const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Multer storage configuration for call recording audio
const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `rec_${Date.now()}_${safeName}${ext || '.mp3'}`);
  },
});

const audioFileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.mp3',
    '.mpeg',
    '.mpg',
    '.wav',
    '.m4a',
    '.mp4',
    '.aac',
    '.ogg',
    '.oga',
    '.webm',
    '.weba',
    '.amr',
    '.caf',
    '.3gp',
    '.3gpp',
    '.opus',
    '.wma',
    '.flac',
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('video/webm') ||
    file.mimetype.startsWith('video/mp4') ||
    file.mimetype === 'application/octet-stream' ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only audio recording files are allowed.'), false);
  }
};

const uploadRecording = multer({
  storage: recordingStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// All customer routes require authentication & approved status
router.use(protect, approvedOnly);

router.route('/')
  .get(getCustomers)
  .post(uploadRecording.single('audio'), createCustomer);

router.post('/check-duplicate', checkDuplicateMobile);

router.route('/:id')
  .get(getCustomerById)
  .put(uploadRecording.single('audio'), updateCustomer)
  .delete(deleteCustomer);

router.route('/:id/documents')
  .post(uploadDoc.single('file'), uploadCustomerDocument);

router.route('/:id/documents/:docId')
  .delete(deleteCustomerDocument);

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  logCall,
  getCustomerCalls,
  getAllCalls,
  getRecordings,
  uploadRecording,
  deleteRecording,
  downloadRecordingFile,
} = require('../controllers/callHistoryController');

// Ensure recordings upload directory exists
const recordingsDir = path.join(__dirname, '../uploads/recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Multer storage for Audio Call Recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `rec_${Date.now()}_${safeName}${ext || '.mp3'}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow all standard and mobile audio recording formats
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
    cb(new Error('Only audio recording files (.mp3, .mpeg, .wav, .m4a, .aac, .ogg, .webm, .amr, .3gp) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max audio recording
});

router.use(protect);

// Recordings list hub (Admin view all, Employee view own)
router.get('/recordings', getRecordings);

// Download specific recording
router.get('/recordings/:id/download', downloadRecordingFile);

// Direct recording upload
router.post('/upload-recording', upload.single('audio'), uploadRecording);

// Delete recording
router.delete('/recordings/:id', deleteRecording);

// General calls routes
router.route('/')
  .get(getAllCalls);

router.route('/:customerId')
  .post(upload.single('audio'), logCall)
  .get(getCustomerCalls);

module.exports = router;

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
} = require('../controllers/callHistoryController');

// Ensure recordings upload directory exists
const recordingsDir = path.join(__dirname, '../../uploads/recordings');
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
  // Allow common audio mime types and file extensions
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.amr', '.caf', '.3gp', '.opus', '.wma'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/webm') || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio recording files (.mp3, .wav, .m4a, .aac, .ogg, .webm, .amr, .3gp) are allowed.'), false);
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

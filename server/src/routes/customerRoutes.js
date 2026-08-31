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

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `doc_${Date.now()}_${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// All customer routes require authentication & approved status
router.use(protect, approvedOnly);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.post('/check-duplicate', checkDuplicateMobile);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

router.route('/:id/documents')
  .post(upload.single('file'), uploadCustomerDocument);

router.route('/:id/documents/:docId')
  .delete(deleteCustomerDocument);

module.exports = router;

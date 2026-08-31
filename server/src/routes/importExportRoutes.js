const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  exportCustomers,
  exportMasterBackup,
  exportModuleData,
  importCustomers,
  getImportTemplate,
} = require('../controllers/importExportController');
const { protect, adminOnly, approvedOnly } = require('../middleware/auth');

// Multer in-memory storage for uploaded files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Single Customer Export
router.get('/export', protect, approvedOnly, exportCustomers);

// Master Full-Database Backup (Admin Only)
router.get('/backup-all', protect, adminOnly, exportMasterBackup);

// Individual Module Export (Customers, Calls, Targets, Reports, Logs, Employees)
router.get('/export-module', protect, approvedOnly, exportModuleData);

// Template & Import are Admin-only
router.get('/template', protect, adminOnly, getImportTemplate);
router.post('/import', protect, adminOnly, upload.single('file'), importCustomers);

module.exports = router;

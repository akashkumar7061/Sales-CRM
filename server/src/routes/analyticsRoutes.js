const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getEmployeeDashboardStats,
} = require('../controllers/analyticsController');
const { protect, adminOnly, approvedOnly } = require('../middleware/auth');

router.get('/admin', protect, adminOnly, getAdminDashboardStats);
router.get('/employee', protect, approvedOnly, getEmployeeDashboardStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitDailyReport,
  getMyDailyReports,
  getAllDailyReports,
  deleteDailyReport,
} = require('../controllers/dailyReportController');

router.use(protect);

router.post('/submit', submitDailyReport);
router.get('/my-reports', getMyDailyReports);
router.get('/all', adminOnly, getAllDailyReports);
router.delete('/:id', adminOnly, deleteDailyReport);

module.exports = router;

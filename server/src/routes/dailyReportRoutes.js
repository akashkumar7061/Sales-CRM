const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitDailyReport,
  getMyDailyReports,
  getAllDailyReports,
  deleteDailyReport,
  updateDailyReport,
} = require('../controllers/dailyReportController');

router.use(protect);

router.post('/submit', submitDailyReport);
router.get('/my-reports', getMyDailyReports);
router.get('/all', adminOnly, getAllDailyReports);
router.route('/:id')
  .put(adminOnly, updateDailyReport)
  .delete(adminOnly, deleteDailyReport);

module.exports = router;

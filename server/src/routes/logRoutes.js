const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/logController');
const { protect, approvedOnly } = require('../middleware/auth');

router.get('/', protect, approvedOnly, getActivityLogs);

module.exports = router;

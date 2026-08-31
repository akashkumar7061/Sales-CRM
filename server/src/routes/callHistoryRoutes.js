const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { logCall, getCustomerCalls, getAllCalls } = require('../controllers/callHistoryController');

router.use(protect);

router.route('/')
  .get(getAllCalls);

router.route('/:customerId')
  .post(logCall)
  .get(getCustomerCalls);

module.exports = router;

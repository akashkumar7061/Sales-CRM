const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getMyTarget, getAllTargets, saveTarget } = require('../controllers/targetController');

router.use(protect);

router.get('/my-target', getMyTarget);
router.get('/all', adminOnly, getAllTargets);
router.post('/', adminOnly, saveTarget);

module.exports = router;

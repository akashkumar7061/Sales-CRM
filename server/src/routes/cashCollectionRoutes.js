const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  exportCollectionData,
} = require('../controllers/cashCollectionController');

// All cash collection endpoints are Admin-Only
router.use(protect);
router.use(adminOnly);

router.route('/')
  .post(createCollection)
  .get(getCollections);

router.get('/export/data', exportCollectionData);

router.route('/:id')
  .get(getCollectionById)
  .put(updateCollection)
  .delete(deleteCollection);

module.exports = router;

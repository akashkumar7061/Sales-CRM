const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getActiveEmployeeList,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/auth');

// List of active employees (available to all logged in users for filters/dropdowns)
router.get('/active-list', protect, getActiveEmployeeList);

// Admin-only employee management endpoints
router.use(protect, adminOnly);

router.route('/')
  .get(getAllEmployees)
  .post(createEmployee);

router.route('/:id')
  .put(updateEmployee)
  .delete(deleteEmployee);

router.patch('/:id/status', updateEmployeeStatus);

module.exports = router;

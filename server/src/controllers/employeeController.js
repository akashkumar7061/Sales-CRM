const User = require('../models/User');
const Customer = require('../models/Customer');
const { createLog } = require('../utils/logger');

// @desc    Get all employees (Admin view)
// @route   GET /api/employees
// @access  Private (Admin only)
exports.getAllEmployees = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { role: 'employee' };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { designation: searchRegex },
      ];
    }

    const employees = await User.find(query).sort({ createdAt: -1 });

    // Aggregate customer counts for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const totalCustomers = await Customer.countDocuments({ createdByEmployeeId: emp._id });
        const pendingFollowups = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          followUpStatus: { $in: ['New', 'Contacted', 'In Discussion', 'Quotation Sent', 'Follow-up Scheduled'] },
        });
        const convertedLeads = await Customer.countDocuments({
          createdByEmployeeId: emp._id,
          followUpStatus: 'Won / Converted',
        });

        return {
          ...emp.toObject(),
          totalCustomers,
          pendingFollowups,
          convertedLeads,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: employeesWithStats.length,
      employees: employeesWithStats,
    });
  } catch (error) {
    console.error('getAllEmployees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees.',
    });
  }
};

// @desc    Get active sales employee list for dropdowns (Admin & Employee)
// @route   GET /api/employees/active-list
// @access  Private
exports.getActiveEmployeeList = async (req, res) => {
  try {
    const employees = await User.find({ status: 'approved' })
      .select('name email designation role avatarColor')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee list.',
    });
  }
};

// @desc    Create new employee by Admin
// @route   POST /api/employees
// @access  Private (Admin only)
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, designation, role, status } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      designation: designation || 'Sales Executive',
      role: role || 'employee',
      status: status || 'approved',
      avatarColor,
    });

    await createLog({
      user: req.user,
      action: 'APPROVE_EMPLOYEE',
      details: `Admin created employee account for ${user.name} (${user.email}).`,
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create employee.',
    });
  }
};

// @desc    Update employee status (Approve, Reject, Activate, Deactivate)
// @route   PATCH /api/employees/:id/status
// @access  Private (Admin only)
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (user.role === 'admin' && status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Admin account status cannot be deactivated.',
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await createLog({
      user: req.user,
      action: status === 'approved' ? 'APPROVE_EMPLOYEE' : 'STATUS_CHANGE_EMPLOYEE',
      details: `Admin changed status of ${user.name} from "${oldStatus}" to "${status}".`,
    });

    res.status(200).json({
      success: true,
      message: `Employee status updated to ${status}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee status.',
    });
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private (Admin only)
exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, phone, designation, role, status, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Another user with this email already exists.',
        });
      }
      user.email = email.toLowerCase();
    }

    if (name) {
      const oldName = user.name;
      user.name = name;
      // Also update salesEmployeeName in all customer records if name changes
      if (oldName !== name) {
        await Customer.updateMany(
          { createdByEmployeeId: user._id },
          { salesEmployeeName: name }
        );
      }
    }

    if (phone) user.phone = phone;
    if (designation) user.designation = designation;
    if (role && user.role !== 'admin') user.role = role;
    if (status) user.status = status;
    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    await user.save();

    await createLog({
      user: req.user,
      action: 'UPDATE_EMPLOYEE',
      details: `Admin updated employee profile for ${user.name}.`,
    });

    res.status(200).json({
      success: true,
      message: 'Employee details updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update employee.',
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
exports.deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete administrator account.',
      });
    }

    // Check if employee has customers
    const customerCount = await Customer.countDocuments({ createdByEmployeeId: user._id });
    if (customerCount > 0) {
      // Reassign customers to the deleting admin or keep them
      await Customer.updateMany(
        { createdByEmployeeId: user._id },
        { salesEmployeeName: `${user.name} (Archived/Deleted)` }
      );
    }

    const empName = user.name;
    await User.findByIdAndDelete(req.params.id);

    await createLog({
      user: req.user,
      action: 'DELETE_EMPLOYEE',
      details: `Admin deleted employee account: ${empName}. (Preserved ${customerCount} historical customer records).`,
    });

    res.status(200).json({
      success: true,
      message: `Employee ${empName} deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee.',
    });
  }
};

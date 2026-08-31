const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLog } = require('../utils/logger');

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_sales_crm_jwt_key_2026_secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new sales employee
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, designation } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employee name, mobile number, and password.',
      });
    }

    const cleanPhone = phone.trim();

    // Check if mobile phone is already registered
    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists. Please login directly.',
      });
    }

    // Optional Email Validation (if provided)
    let cleanEmail = '';
    if (email && email.trim()) {
      cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address or leave it blank.',
        });
      }

      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }
    }

    // Generate random avatar background color
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user (defaults to employee & pending approval)
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: cleanPhone,
      designation: designation ? designation.trim() : 'Sales Executive',
      role: 'employee',
      status: 'pending', // Requires admin approval
      avatarColor,
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending admin approval. You can log in once approved.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;
    const identifier = (phone || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: role === 'employee' ? 'Please provide mobile number and password.' : 'Please provide email and password.',
      });
    }

    // Clean phone/identifier (strip spaces and hyphens)
    const cleanPhone = identifier.replace(/[^0-9+]/g, '');

    // Find user by phone OR email
    const user = await User.findOne({
      $or: [
        { phone: identifier },
        { phone: cleanPhone },
        { email: identifier.toLowerCase() },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: role === 'employee' ? 'Invalid mobile number or password.' : 'Invalid email or password.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: role === 'employee' ? 'Invalid mobile number or password.' : 'Invalid email or password.',
      });
    }

    // Optional role check if passed
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account does not have ${role} privileges. Please select the correct login tab.`,
      });
    }

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator approval. Please check back later.',
        status: 'pending',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your account registration has been rejected by the administrator.',
        status: 'rejected',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
        status: 'inactive',
      });
    }

    // Log the successful login
    await createLog({
      user,
      action: 'LOGIN',
      details: `${user.name} (${user.role}) logged in successfully.`,
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        status: user.status,
        avatarColor: user.avatarColor,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        status: user.status,
        avatarColor: user.avatarColor,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await createLog({
      user,
      action: 'PASSWORD_CHANGE',
      details: `${user.name} (${user.role}) changed account password successfully.`,
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! You can now use your new password.',
      token,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password.',
      error: error.message,
    });
  }
};

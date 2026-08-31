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

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, phone)',
      });
    }

    // Strict Email Format Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid work email address (e.g. yourname@company.com).',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate random avatar background color
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // Create user (defaults to employee & pending approval)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      designation: designation || 'Sales Executive',
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

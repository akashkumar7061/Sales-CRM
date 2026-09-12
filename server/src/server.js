const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(
  compression({
    filter: (req, res) => {
      if (req.path && req.path.startsWith('/uploads/')) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
app.use(
  cors({
    origin: '*', // Allow all origins for dev/internal network access
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('etag', 'strong');

// Serve static uploaded files with 30-day mobile browser caching
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '30d',
    immutable: true,
  })
);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/calls', require('./routes/callHistoryRoutes'));
app.use('/api/targets', require('./routes/targetRoutes'));
app.use('/api/reports', require('./routes/dailyReportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/import-export', require('./routes/importExportRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/cash-collections', require('./routes/cashCollectionRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Sales Customer Management API',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Sales CRM API Server running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`========================================`);
});

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

const fs = require('fs');

// MIME types for audio streaming and documents
const MIME_MAP = {
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.mpg': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
  '.weba': 'audio/webm',
  '.amr': 'audio/amr',
  '.3gp': 'audio/3gpp',
  '.3gpp': 'audio/3gpp',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const { streamFileFromGridFS, restoreFileFromGridFS } = require('./utils/gridfsStorage');

// Resilient byte-range static audio & file server middleware with GridFS cloud fallback
const serveUploads = async (req, res, next) => {
  let subPath = req.path;
  if (!subPath || subPath === '/') {
    return res.status(404).json({ success: false, message: 'Upload path is required.' });
  }

  // Normalize path & prevent path traversal
  const safeSubPath = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '');
  const filename = path.basename(safeSubPath);

  // Look in server/uploads first, then root/uploads
  let filePath = path.join(__dirname, '../uploads', safeSubPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '../../uploads', safeSubPath);
  }

  const ext = path.extname(safeSubPath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  // If file exists on disk, stream directly with byte-range support
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // 206 Partial Content for byte-range seeking (iOS Safari, mobile Chrome)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({ 'Content-Range': `bytes */${fileSize}` });
        return res.end();
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=2592000',
      });
      return stream.pipe(res);
    } else {
      // 200 Full content streaming
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=2592000',
      });
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // Fallback to MongoDB Cloud GridFS (Permanent Cloud Database Storage)
  try {
    const streamed = await streamFileFromGridFS(filename, req, res, contentType);
    if (streamed) {
      restoreFileFromGridFS(filename, filePath).catch(() => {});
      return;
    }
  } catch (gridErr) {
    console.warn('GridFS stream fallback warning:', gridErr);
  }

  return res.status(404).json({
    success: false,
    message: `Audio file not found on server or database: ${req.originalUrl}`,
  });
};

// Serve static uploaded files across /uploads and /api/uploads
app.use('/uploads', serveUploads);
app.use('/api/uploads', serveUploads);

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

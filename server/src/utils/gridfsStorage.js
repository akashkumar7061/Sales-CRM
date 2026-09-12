const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let gridFsBucket = null;

// Initialize GridFS Bucket once DB is connected
const getGridFSBucket = () => {
  if (!gridFsBucket && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    gridFsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'audio_recordings',
    });
  }
  return gridFsBucket;
};

// Upload local file to GridFS (Permanent Cloud MongoDB Storage)
const saveFileToGridFS = async (filePath, filename, metadata = {}) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) {
      console.warn('GridFSBucket not ready yet.');
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.warn('Physical file not found for GridFS upload:', filePath);
      return null;
    }

    // Check if file already exists in GridFS
    const existing = await bucket.find({ filename }).toArray();
    if (existing && existing.length > 0) {
      return existing[0]._id;
    }

    return new Promise((resolve) => {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          ...metadata,
          uploadedAt: new Date(),
        },
      });

      const streamId = uploadStream.id;

      fs.createReadStream(filePath)
        .pipe(uploadStream)
        .on('error', (err) => {
          console.error('GridFS Upload Stream Error:', err);
          resolve(null);
        })
        .on('finish', () => {
          console.log('✅ File permanently backed up to MongoDB Cloud GridFS:', filename, streamId);
          resolve(streamId);
        });
    });
  } catch (error) {
    console.error('saveFileToGridFS Error:', error);
    return null;
  }
};

// Find and stream file from GridFS to response with HTTP 206 byte-range support
const streamFileFromGridFS = async (filename, req, res, contentType = 'audio/mpeg') => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) return false;

    const files = await bucket.find({ filename }).toArray();
    if (!files || files.length === 0) {
      return false;
    }

    const fileDoc = files[0];
    const fileSize = fileDoc.length;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({ 'Content-Range': 'bytes */' + fileSize });
        return true;
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=2592000',
      });

      const downloadStream = bucket.openDownloadStream(fileDoc._id, {
        start,
        end: end + 1,
      });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=2592000',
      });

      const downloadStream = bucket.openDownloadStream(fileDoc._id);
      downloadStream.pipe(res);
    }

    return true;
  } catch (error) {
    console.error('streamFileFromGridFS Error:', error);
    return false;
  }
};

// Restore file from GridFS to local disk cache
const restoreFileFromGridFS = async (filename, targetFilePath) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) return false;

    const files = await bucket.find({ filename }).toArray();
    if (!files || files.length === 0) return false;

    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve) => {
      const downloadStream = bucket.openDownloadStream(files[0]._id);
      const writeStream = fs.createWriteStream(targetFilePath);

      downloadStream
        .pipe(writeStream)
        .on('error', (err) => {
          console.warn('Error restoring file from GridFS:', err);
          resolve(false);
        })
        .on('finish', () => {
          console.log('Restored file from GridFS to local disk:', filename);
          resolve(true);
        });
    });
  } catch (err) {
    console.warn('restoreFileFromGridFS error:', err);
    return false;
  }
};

// Delete file from GridFS permanently
const deleteFileFromGridFS = async (filename) => {
  try {
    const bucket = getGridFSBucket();
    if (!bucket) return false;

    const files = await bucket.find({ filename }).toArray();
    for (const f of files) {
      await bucket.delete(f._id);
      console.log('Deleted file from GridFS permanently:', filename, f._id);
    }
    return true;
  } catch (error) {
    console.warn('deleteFileFromGridFS error:', error);
    return false;
  }
};

module.exports = {
  getGridFSBucket,
  saveFileToGridFS,
  streamFileFromGridFS,
  restoreFileFromGridFS,
  deleteFileFromGridFS,
};

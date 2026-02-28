/**
 * ============================================
 * STSMS — Multer Upload Configuration
 * ============================================
 * Configures file uploads for video processing.
 * - Storage: local /uploads directory
 * - Filter: video files only
 * - Limit: 500 MB max file size
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---- Storage Config ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

// ---- File Filter: Allow video formats only ----
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/i;
  const isVideoMime = file.mimetype.startsWith('video/');
  const hasValidExt = allowedExtensions.test(path.extname(file.originalname));

  if (isVideoMime || hasValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, avi, mov, mkv, wmv, flv, webm)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});

module.exports = upload;

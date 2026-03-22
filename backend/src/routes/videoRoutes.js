/**
 * ============================================
 * STSMS — Video Routes
 * ============================================
 * POST   /api/videos/upload  — Upload video for processing
 * GET    /api/videos          — List all processing jobs
 * GET    /api/videos/:id      — Get job status
 * DELETE /api/videos/:id      — Delete job + file (admin)
 */

const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  processVideoJob,
  getVideoJobs,
  getVideoJobById,
  deleteVideoJob,
} = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// All video routes require authentication
router.use(protect);

// Upload route — multer handles the file, then controller processes
router.post('/upload', upload.single('video'), uploadVideo);

// Job management
router.get('/', getVideoJobs);
router.get('/:id', getVideoJobById);
router.post('/:id/process', processVideoJob);
router.delete('/:id', authorize('admin'), deleteVideoJob);

module.exports = router;

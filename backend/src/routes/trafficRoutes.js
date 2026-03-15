/**
 * ============================================
 * STSMS — Traffic Routes
 * ============================================
 * GET /api/traffic              — List traffic records
 * GET /api/traffic/stats        — Aggregated statistics
 * GET /api/traffic/:id          — Single record
 * GET /api/traffic/camera/:cameraId — Records by camera
 */

const express = require('express');
const router = express.Router();
const {
  getTrafficRecords,
  getTrafficRecordById,
  getTrafficByCamera,
  getTrafficStats,
  createTrafficRecord,
} = require('../controllers/trafficController');
const { protect } = require('../middleware/auth');

// All traffic routes require authentication
router.use(protect);

// Stats must come before /:id to avoid route conflict
router.get('/stats', getTrafficStats);
router.get('/camera/:cameraId', getTrafficByCamera);
router.get('/:id', getTrafficRecordById);
router.get('/', getTrafficRecords);
router.post('/', createTrafficRecord);

module.exports = router;

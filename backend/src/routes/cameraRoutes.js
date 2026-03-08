/**
 * ============================================
 * STSMS — Camera Routes
 * ============================================
 * GET    /api/cameras       — List all cameras
 * GET    /api/cameras/:id   — Get single camera
 * POST   /api/cameras       — Create camera (admin)
 * PUT    /api/cameras/:id   — Update camera (admin)
 * DELETE /api/cameras/:id   — Delete camera (admin)
 */

const express = require('express');
const router = express.Router();
const {
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
} = require('../controllers/cameraController');
const { protect, authorize } = require('../middleware/auth');

// All camera routes require authentication
router.use(protect);

// Public (authenticated) routes
router.get('/', getCameras);
router.get('/:id', getCameraById);

// Admin-only routes
router.post('/', authorize('admin'), createCamera);
router.put('/:id', authorize('admin'), updateCamera);
router.delete('/:id', authorize('admin'), deleteCamera);

module.exports = router;

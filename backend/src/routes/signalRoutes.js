/**
 * ============================================
 * STSMS — Traffic Signal Routes
 * ============================================
 * GET    /api/signals             — List all smart intersections
 * GET    /api/signals/:id         — Get single intersection state & split analysis
 * POST   /api/signals             — Create new intersection (Admin)
 * POST   /api/signals/:id/simulate — Inject / fluctuate vehicle counts & recalculate dynamic green times
 * POST   /api/signals/:id/transition — Advance intersection phase with dynamic green duration
 * PATCH  /api/signals/:id/emergency — Trigger emergency corridor override (Ambulance / Fire)
 * DELETE /api/signals/:id/emergency — Reset emergency override back to Dynamic AI Mode
 */

const express = require('express');
const router = express.Router();
const {
  getSignals,
  getSignalById,
  createSignal,
  simulateTrafficFlow,
  transitionPhase,
  triggerEmergencyOverride,
  resetEmergencyOverride,
} = require('../controllers/signalController');
const { protect, authorize } = require('../middleware/auth');

// All signal routes require authentication
router.use(protect);

router.get('/', getSignals);
router.get('/:id', getSignalById);
router.post('/', authorize('admin'), createSignal);

// Simulation & dynamic operations
router.post('/:id/simulate', simulateTrafficFlow);
router.post('/:id/transition', transitionPhase);
router.patch('/:id/emergency', triggerEmergencyOverride);
router.delete('/:id/emergency', resetEmergencyOverride);

module.exports = router;

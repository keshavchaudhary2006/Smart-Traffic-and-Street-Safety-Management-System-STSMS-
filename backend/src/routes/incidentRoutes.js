/**
 * ============================================
 * STSMS — Incident & Violation Routes
 * ============================================
 * GET   /api/incidents             — List safety incidents
 * GET   /api/incidents/:id         — Get incident details
 * POST  /api/incidents             — Create incident
 * PATCH /api/incidents/:id/status  — Update incident status
 * POST  /api/incidents/simulate    — Trigger simulated accident / collision
 * 
 * GET   /api/violations            — List traffic violations
 * POST  /api/violations/simulate   — Trigger simulated red-light / speed violation
 */

const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  simulateIncident,
  getViolations,
  simulateViolation,
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');

// All incident & violation routes require authentication
router.use(protect);

// Incident Routes
router.get('/incidents', getIncidents);
router.get('/incidents/:id', getIncidentById);
router.post('/incidents', authorize('admin'), createIncident);
router.patch('/incidents/:id/status', updateIncidentStatus);
router.post('/incidents/simulate', simulateIncident);

// Violation Routes
router.get('/violations', getViolations);
router.post('/violations/simulate', simulateViolation);

module.exports = router;

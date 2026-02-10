/**
 * ============================================
 * STSMS — Auth Routes
 * ============================================
 * POST /api/auth/register  — Create a new account
 * POST /api/auth/login     — Login and receive JWT
 * GET  /api/auth/me        — Get current user profile (protected)
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;

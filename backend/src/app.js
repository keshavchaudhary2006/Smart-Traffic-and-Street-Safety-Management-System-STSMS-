/**
 * ============================================
 * STSMS — Express Application
 * ============================================
 * Configures Express middleware, mounts routes,
 * and registers the global error handler.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { CLIENT_URL, NODE_ENV } = require('./config/env');

// Route imports
const authRoutes = require('./routes/authRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const videoRoutes = require('./routes/videoRoutes');
const signalRoutes = require('./routes/signalRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const path = require('path');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ──────────────────────────────────────────────
// Security & Parsing Middleware
// ──────────────────────────────────────────────
app.use(helmet());                              // Security headers
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,                            // Allow cookies
}));
app.use(express.json({ limit: '10mb' }));       // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());                        // Parse cookies

// Serve static uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// HTTP request logging (skip in test)
if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'STSMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api', incidentRoutes);

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ──────────────────────────────────────────────
// Global Error Handler (must be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

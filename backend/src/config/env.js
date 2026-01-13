/**
 * ============================================
 * STSMS — Environment Configuration
 * ============================================
 * Centralizes all environment variables with defaults.
 * Loaded once at startup via dotenv.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root (backend/.env) or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// If not found, try project root
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/stsms',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
};

/**
 * ============================================
 * STSMS — Global Error Handler
 * ============================================
 * Catches all unhandled errors from routes and middleware.
 * Normalizes error responses into a consistent JSON format.
 *
 * Must be registered LAST in the Express middleware chain.
 */

const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = `Validation failed: ${fields.join(', ')}`;
  }

  // Mongoose duplicate key (e.g., unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}. This value already exists.`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded video exceeds the maximum allowed file limit (500 MB).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected form field: ${err.field}. Please use 'video' field name.`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error(`[${statusCode}] ${message}`, err.stack);
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;

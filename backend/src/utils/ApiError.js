/**
 * ============================================
 * STSMS — Custom API Error
 * ============================================
 * Extends Error with an HTTP status code for clean
 * error propagation through Express middleware.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode — HTTP status code
   * @param {string} message — Error message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

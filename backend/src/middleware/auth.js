/**
 * ============================================
 * STSMS — Authentication & Authorization Middleware
 * ============================================
 * protect  — Verifies JWT, attaches req.user
 * authorize — Role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET } = require('../config/env');

/**
 * Protect routes — verify JWT token
 * Reads token from Authorization: Bearer <token>
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);

  // Attach user to request (exclude password)
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new ApiError(401, 'Not authorized — user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Authorize by role
 * Usage: authorize('admin') or authorize('admin', 'user')
 * @param  {...string} roles — Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};

module.exports = { protect, authorize };

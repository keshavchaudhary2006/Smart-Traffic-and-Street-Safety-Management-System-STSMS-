/**
 * ============================================
 * STSMS — Camera Model
 * ============================================
 * Represents a traffic/surveillance camera registered
 * in the system. Tracks location, stream URL, type,
 * and operational status.
 */

const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    location: {
      address: { type: String, trim: true },
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      zone: { type: String, trim: true }, // e.g., "Zone-A", "Downtown"
    },

    streamUrl: {
      type: String,
      trim: true, // RTSP or HTTP stream URL
    },

    type: {
      type: String,
      enum: ['fixed', 'ptz', 'mobile'],
      default: 'fixed',
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },

    resolution: {
      type: String,
      default: '1080p',
    },

    installedAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
cameraSchema.index({ status: 1 });
cameraSchema.index({ 'location.zone': 1 });
cameraSchema.index({ name: 'text', 'location.address': 'text' });

module.exports = mongoose.model('Camera', cameraSchema);

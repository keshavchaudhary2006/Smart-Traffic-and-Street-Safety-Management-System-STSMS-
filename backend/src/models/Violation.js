/**
 * ============================================
 * STSMS — Violation Model
 * ============================================
 * Stores detected traffic and safety violations:
 *   - Red Light Violations
 *   - Speeding & Reckless Driving
 *   - Wrong-Way Corridor Entry
 *   - Illegal Turns / Lane Infractions
 *   - Helmet / Seatbelt Non-Compliance
 */

const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    violationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `VIO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    },

    type: {
      type: String,
      required: [true, 'Violation type is required'],
      enum: [
        'RED_LIGHT',
        'SPEEDING',
        'WRONG_WAY',
        'ILLEGAL_U_TURN',
        'NO_HELMET',
        'BUS_LANE_INTRUSION',
        'PEDESTRIAN_CROSSWALK_BLOCK',
      ],
      index: true,
    },

    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },

    location: {
      address: { type: String, trim: true },
      zone: { type: String, default: 'Zone-A', trim: true },
      corridor: { type: String, trim: true },
    },

    vehicle: {
      type: { type: String, default: 'car' }, // car, motorcycle, truck, bus
      licensePlate: { type: String, trim: true, default: 'UNRECORDED' },
      color: { type: String, trim: true },
      speedKmh: { type: Number, default: 0 },
      speedLimitKmh: { type: Number, default: 50 },
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'CONFIRMED', 'CITATION_ISSUED', 'DISMISSED'],
      default: 'CONFIRMED',
      index: true,
    },

    fineAmount: {
      type: Number,
      default: 100,
    },

    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      default: null,
    },

    trafficRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrafficRecord',
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
violationSchema.index({ severity: 1, timestamp: -1 });
violationSchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('Violation', violationSchema);

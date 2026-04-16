/**
 * ============================================
 * STSMS — Traffic Signal Model
 * ============================================
 * Represents a 4-way smart intersection with dynamic AI signal timing,
 * per-approach telemetry (North, South, East, West), and emergency override.
 */

const mongoose = require('mongoose');

const approachSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: ['RED', 'YELLOW', 'GREEN'],
      default: 'RED',
    },
    timer: {
      type: Number,
      default: 20, // Current countdown in seconds
    },
    allocatedGreen: {
      type: Number,
      default: 20, // Total green allocated for current phase
    },
    density: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    vehicleCount: {
      type: Number,
      default: 0,
    },
    pcu: {
      type: Number,
      default: 0,
    },
    lanes: {
      type: Number,
      default: 2,
    },
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      default: null,
    },
  },
  { _id: false }
);

const trafficSignalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Intersection name is required'],
      trim: true,
      maxlength: 120,
    },

    zone: {
      type: String,
      default: 'Zone-A',
      trim: true,
    },

    location: {
      address: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    mode: {
      type: String,
      enum: ['dynamic_ai', 'fixed_timer', 'emergency_override', 'manual'],
      default: 'dynamic_ai',
    },

    activePhase: {
      type: String,
      enum: ['NORTH_SOUTH', 'EAST_WEST', 'ALL_RED'],
      default: 'NORTH_SOUTH',
    },

    cycleCount: {
      type: Number,
      default: 0,
    },

    // 4-Way Approach Telemetry
    approaches: {
      north: { type: approachSchema, default: () => ({ state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 6, pcu: 7 }) },
      south: { type: approachSchema, default: () => ({ state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 8, pcu: 8.5 }) },
      east: { type: approachSchema, default: () => ({ state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 4, pcu: 4 }) },
      west: { type: approachSchema, default: () => ({ state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 5, pcu: 5.5 }) },
    },

    // Emergency Vehicle Green-Wave Priority
    emergency: {
      active: { type: Boolean, default: false },
      corridor: { type: String, enum: ['north', 'south', 'east', 'west', null], default: null },
      vehicleType: { type: String, default: null }, // e.g., 'Ambulance', 'Fire Truck', 'Police'
      startedAt: { type: Date, default: null },
    },

    lastSwitchedAt: {
      type: Date,
      default: Date.now,
    },

    stats: {
      totalVehiclesCleared: { type: Number, default: 0 },
      congestionReductionPercent: { type: Number, default: 28.5 },
      averageWaitReductionSeconds: { type: Number, default: 18.2 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
trafficSignalSchema.index({ zone: 1 });
trafficSignalSchema.index({ mode: 1 });

module.exports = mongoose.model('TrafficSignal', trafficSignalSchema);

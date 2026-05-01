/**
 * ============================================
 * STSMS — Incident Model
 * ============================================
 * Stores major roadway safety incidents, collisions,
 * bottlenecks, and emergency dispatches.
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `INC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    },

    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: [
        'VEHICLE_COLLISION',
        'PEDESTRIAN_INCIDENT',
        'SEVERE_GRIDLOCK',
        'ROAD_HAZARD',
        'VEHICLE_BREAKDOWN',
        'EMERGENCY_CORRIDOR_BLOCK',
      ],
      index: true,
    },

    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },

    status: {
      type: String,
      enum: ['REPORTED', 'DISPATCHED', 'FIRST_RESPONDERS_ON_SCENE', 'RESOLVED'],
      default: 'REPORTED',
      index: true,
    },

    location: {
      address: { type: String, trim: true },
      zone: { type: String, default: 'Zone-A', trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    involvedVehicles: [
      {
        type: { type: String }, // car, truck, motorcycle, bus
        licensePlate: { type: String },
        damageSeverity: { type: String, enum: ['MINOR', 'MODERATE', 'SEVERE'] },
      },
    ],

    responderDispatched: {
      dispatched: { type: Boolean, default: false },
      unitType: { type: String, default: null }, // Ambulance, Traffic Police, Tow Truck, Fire Rescue
      dispatchedAt: { type: Date, default: null },
    },

    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      default: null,
    },

    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ reportedAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);

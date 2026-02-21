/**
 * ============================================
 * STSMS — Traffic Record Model
 * ============================================
 * Stores per-frame or per-interval traffic analytics
 * produced by the AI service (YOLO detections).
 *
 * Each record is linked to a camera and optionally
 * to a video processing job.
 */

const mongoose = require('mongoose');

const trafficRecordSchema = new mongoose.Schema(
  {
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      default: null,
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // ---- Vehicle & Pedestrian Counts ----
    vehicleCount: { type: Number, default: 0, min: 0 },
    pedestrianCount: { type: Number, default: 0, min: 0 },
    bicycleCount: { type: Number, default: 0, min: 0 },

    // ---- Traffic Flow ----
    congestionLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'gridlock'],
      default: 'low',
    },

    averageSpeed: {
      type: Number, // km/h
      default: 0,
      min: 0,
    },

    // ---- Safety Violations ----
    violations: [
      {
        type: { type: String },         // e.g., 'red_light', 'wrong_way', 'speeding', 'no_helmet'
        confidence: { type: Number, min: 0, max: 1 },
        vehicleType: { type: String },  // e.g., 'car', 'truck', 'motorcycle'
        plateNumber: { type: String },
        imageUrl: { type: String },
        detectedAt: { type: Date, default: Date.now },
      },
    ],

    // ---- Raw YOLO Detections ----
    detections: [
      {
        class: { type: String },         // YOLO class: car, truck, person, bicycle, bus...
        confidence: { type: Number, min: 0, max: 1 },
        bbox: { type: [Number] },        // [x, y, width, height]
      },
    ],

    // ---- References ----
    videoJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoProcessingJob',
      default: null,
    },

    weatherCondition: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
trafficRecordSchema.index({ camera: 1, timestamp: -1 });
trafficRecordSchema.index({ congestionLevel: 1 });
trafficRecordSchema.index({ timestamp: -1 });
trafficRecordSchema.index({ 'violations.type': 1 });

module.exports = mongoose.model('TrafficRecord', trafficRecordSchema);

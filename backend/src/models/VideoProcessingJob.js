/**
 * ============================================
 * STSMS — Video Processing Job Model
 * ============================================
 * Tracks the lifecycle of a video file uploaded
 * for AI analysis. Stores upload metadata, processing
 * status/progress, and final detection results.
 *
 * Lifecycle: pending → processing → completed | failed
 */

const mongoose = require('mongoose');

const videoProcessingJobSchema = new mongoose.Schema(
  {
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      default: null, // null for manually uploaded test videos
    },

    // ---- File Metadata ----
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },

    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
    },

    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },

    fileSize: {
      type: Number, // bytes
    },

    mimeType: {
      type: String,
    },

    duration: {
      type: Number, // seconds
      default: null,
    },

    // ---- Processing Status ----
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ---- Results (populated after AI processing) ----
    result: {
      totalFrames: { type: Number, default: 0 },
      processedFrames: { type: Number, default: 0 },
      detections: { type: Number, default: 0 },
      vehicleCount: { type: Number, default: 0 },
      pedestrianCount: { type: Number, default: 0 },
      violationCount: { type: Number, default: 0 },
      summary: { type: mongoose.Schema.Types.Mixed }, // flexible JSON summary
    },

    // ---- Timestamps ----
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ---- Error Info ----
    error: {
      type: String,
      default: null,
    },

    // ---- Who uploaded ----
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
videoProcessingJobSchema.index({ status: 1, createdAt: -1 });
videoProcessingJobSchema.index({ camera: 1 });
videoProcessingJobSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('VideoProcessingJob', videoProcessingJobSchema);

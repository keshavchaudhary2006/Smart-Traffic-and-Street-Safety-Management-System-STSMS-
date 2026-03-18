/**
 * ============================================
 * STSMS — Video Controller & AI Integration
 * ============================================
 * Handles video upload and triggers Python YOLO AI processing:
 *   - Uploads video to local /uploads
 *   - Initiates asynchronous computer vision job via Python FastAPI
 *   - Ingests detected counts & safety metrics into MongoDB
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const VideoProcessingJob = require('../models/VideoProcessingJob');
const TrafficRecord = require('../models/TrafficRecord');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { AI_SERVICE_URL } = require('../config/env');

/**
 * Asynchronous worker: calls the Python YOLO AI service and saves results to DB.
 * Runs in the background without blocking the HTTP upload response.
 *
 * @param {string} jobId - MongoDB ID of the VideoProcessingJob
 */
async function triggerAIVideoInference(jobId) {
  try {
    const job = await VideoProcessingJob.findById(jobId);
    if (!job) {
      console.error(`❌ AI Worker: Job ${jobId} not found`);
      return;
    }

    // Step 1: Mark job as actively processing
    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 15;
    await job.save();

    console.log(`🤖 AI Worker: Dispatching video to YOLO service (${AI_SERVICE_URL}/detect)...`);
    const absoluteVideoPath = path.resolve(job.filePath);

    // Step 2: Request inference from Python service
    const response = await axios.post(
      `${AI_SERVICE_URL}/detect`,
      {
        video_path: absoluteVideoPath,
        sample_rate: 2,
      },
      {
        timeout: 300000, // 5 min timeout for video processing
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const aiData = response.data;
    const summary = aiData.summary || {};
    const metadata = aiData.video_metadata || {};

    // Step 3: Update Job with AI summary
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    job.result = {
      totalFrames: metadata.total_frames || 0,
      processedFrames: metadata.processed_frames || 0,
      detections: aiData.detections ? aiData.detections.length : 0,
      vehicleCount: summary.total_vehicles || 0,
      pedestrianCount: summary.pedestrian_count || 0,
      violationCount: summary.violations_detected || 0,
      summary: summary,
    };
    await job.save();

    // Step 4: Automatically create a TrafficRecord for live dashboard ingestion
    await TrafficRecord.create({
      camera: job.camera || null,
      timestamp: new Date(),
      vehicleCount: summary.total_vehicles || 0,
      pedestrianCount: summary.pedestrian_count || 0,
      bicycleCount: summary.bicycle_count || 0,
      congestionLevel: summary.congestion_level || 'low',
      averageSpeed: summary.average_speed_kmh || 45.0,
      violations: (aiData.violations || []).map((v) => ({
        type: v.type,
        confidence: v.confidence,
        vehicleType: v.vehicleType,
        imageUrl: v.imageUrl,
        detectedAt: new Date(),
      })),
      detections: (aiData.detections || []).map((d) => ({
        class: d.class,
        confidence: d.confidence,
        bbox: d.bbox,
      })),
      videoJob: job._id,
      weatherCondition: 'Clear',
    });

    console.log(`✅ AI Worker: Video analysis completed for Job ${jobId}. Vehicles found: ${summary.total_vehicles}`);
  } catch (error) {
    console.error(`❌ AI Worker: Inference failed for Job ${jobId}:`, error.message);

    try {
      const job = await VideoProcessingJob.findById(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.response?.data?.detail || error.message;
        await job.save();
      }
    } catch (dbErr) {
      console.error('Failed to update job failure status:', dbErr.message);
    }
  }
}

/**
 * @desc    Upload a video for processing
 * @route   POST /api/videos/upload
 * @access  Private
 */
const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No video file uploaded');
  }

  // Create initial processing job record
  const job = await VideoProcessingJob.create({
    camera: req.body.cameraId || null,
    filename: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    status: 'pending',
    progress: 0,
    uploadedBy: req.user._id,
  });

  // Launch the AI inference pipeline in the background
  triggerAIVideoInference(job._id);

  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully. AI processing initiated in background.',
    data: {
      job: {
        _id: job._id,
        filename: job.filename,
        originalName: job.originalName,
        fileSize: job.fileSize,
        status: job.status,
        createdAt: job.createdAt,
      },
    },
  });
});

/**
 * @desc    Manually re-trigger or process an existing video job
 * @route   POST /api/videos/:id/process
 * @access  Private
 */
const processVideoJob = asyncHandler(async (req, res) => {
  const job = await VideoProcessingJob.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Video processing job not found');
  }

  // Trigger inference
  triggerAIVideoInference(job._id);

  res.status(200).json({
    success: true,
    message: 'AI video analysis triggered.',
    data: { job },
  });
});

/**
 * @desc    Get all video processing jobs
 * @route   GET /api/videos
 * @access  Private
 */
const getVideoJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [jobs, total] = await Promise.all([
    VideoProcessingJob.find(filter)
      .populate('camera', 'name location.zone')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    VideoProcessingJob.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Video jobs retrieved',
    data: {
      jobs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    },
  });
});

/**
 * @desc    Get a single video processing job by ID
 * @route   GET /api/videos/:id
 * @access  Private
 */
const getVideoJobById = asyncHandler(async (req, res) => {
  const job = await VideoProcessingJob.findById(req.params.id)
    .populate('camera', 'name location')
    .populate('uploadedBy', 'name email');

  if (!job) {
    throw new ApiError(404, 'Video processing job not found');
  }

  res.status(200).json({
    success: true,
    message: 'Video job retrieved',
    data: { job },
  });
});

/**
 * @desc    Delete a video processing job and its file
 * @route   DELETE /api/videos/:id
 * @access  Private (Admin)
 */
const deleteVideoJob = asyncHandler(async (req, res) => {
  const job = await VideoProcessingJob.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Video processing job not found');
  }

  // Delete the physical file if it exists
  if (job.filePath && fs.existsSync(job.filePath)) {
    try {
      fs.unlinkSync(job.filePath);
    } catch (err) {
      console.warn('Could not remove file from disk:', err.message);
    }
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Video job and file deleted successfully',
    data: {},
  });
});

module.exports = {
  uploadVideo,
  processVideoJob,
  getVideoJobs,
  getVideoJobById,
  deleteVideoJob,
};

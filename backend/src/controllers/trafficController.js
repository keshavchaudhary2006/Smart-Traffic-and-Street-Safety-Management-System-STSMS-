/**
 * ============================================
 * STSMS — Traffic Controller
 * ============================================
 * Handles traffic record queries:
 *   - List records with filters (camera, date range, congestion)
 *   - Get a single record
 *   - Get traffic stats/summary
 *   - Get records by camera ID
 */

const TrafficRecord = require('../models/TrafficRecord');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all traffic records (with filters & pagination)
 * @route   GET /api/traffic
 * @access  Private
 */
const getTrafficRecords = asyncHandler(async (req, res) => {
  const {
    camera,
    congestionLevel,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (camera) filter.camera = camera;
  if (congestionLevel) filter.congestionLevel = congestionLevel;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [records, total] = await Promise.all([
    TrafficRecord.find(filter)
      .populate('camera', 'name location.zone status')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    TrafficRecord.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Traffic records retrieved',
    data: {
      records,
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
 * @desc    Get a single traffic record by ID
 * @route   GET /api/traffic/:id
 * @access  Private
 */
const getTrafficRecordById = asyncHandler(async (req, res) => {
  const record = await TrafficRecord.findById(req.params.id)
    .populate('camera', 'name location status')
    .populate('videoJob', 'filename status progress');

  if (!record) {
    throw new ApiError(404, 'Traffic record not found');
  }

  res.status(200).json({
    success: true,
    message: 'Traffic record retrieved',
    data: { record },
  });
});

/**
 * @desc    Get traffic records for a specific camera
 * @route   GET /api/traffic/camera/:cameraId
 * @access  Private
 */
const getTrafficByCamera = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [records, total] = await Promise.all([
    TrafficRecord.find({ camera: req.params.cameraId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    TrafficRecord.countDocuments({ camera: req.params.cameraId }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Camera traffic records retrieved',
    data: {
      records,
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
 * @desc    Get aggregated traffic statistics
 * @route   GET /api/traffic/stats
 * @access  Private
 */
const getTrafficStats = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours, 10) * 60 * 60 * 1000);

  const stats = await TrafficRecord.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalVehicles: { $sum: '$vehicleCount' },
        totalPedestrians: { $sum: '$pedestrianCount' },
        totalBicycles: { $sum: '$bicycleCount' },
        avgSpeed: { $avg: '$averageSpeed' },
        totalViolations: { $sum: { $size: { $ifNull: ['$violations', []] } } },
      },
    },
  ]);

  const congestionBreakdown = await TrafficRecord.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$congestionLevel',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    message: 'Traffic statistics retrieved',
    data: {
      period: `Last ${hours} hours`,
      summary: stats[0] || {
        totalRecords: 0,
        totalVehicles: 0,
        totalPedestrians: 0,
        totalBicycles: 0,
        avgSpeed: 0,
        totalViolations: 0,
      },
      congestionBreakdown,
    },
  });
});

/**
 * @desc    Create a new traffic record (e.g. from AI inference or sensor)
 * @route   POST /api/traffic
 * @access  Private
 */
const createTrafficRecord = asyncHandler(async (req, res) => {
  const {
    camera,
    timestamp,
    vehicleCount,
    pedestrianCount,
    bicycleCount,
    congestionLevel,
    averageSpeed,
    violations,
    detections,
    videoJob,
    weatherCondition,
  } = req.body;

  if (!camera) {
    throw new ApiError(400, 'Camera ID is required');
  }

  const record = await TrafficRecord.create({
    camera,
    timestamp: timestamp || Date.now(),
    vehicleCount: vehicleCount || 0,
    pedestrianCount: pedestrianCount || 0,
    bicycleCount: bicycleCount || 0,
    congestionLevel: congestionLevel || 'low',
    averageSpeed: averageSpeed || 0,
    violations: violations || [],
    detections: detections || [],
    videoJob: videoJob || null,
    weatherCondition,
  });

  res.status(201).json({
    success: true,
    message: 'Traffic record recorded successfully',
    data: { record },
  });
});

module.exports = {
  getTrafficRecords,
  getTrafficRecordById,
  getTrafficByCamera,
  getTrafficStats,
  createTrafficRecord,
};

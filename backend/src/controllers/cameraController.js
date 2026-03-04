/**
 * ============================================
 * STSMS — Camera Controller
 * ============================================
 * Full CRUD operations for camera management.
 *   - List all cameras (with filters)
 *   - Get single camera by ID
 *   - Create a new camera (admin only)
 *   - Update camera details (admin only)
 *   - Delete a camera (admin only)
 */

const Camera = require('../models/Camera');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all cameras
 * @route   GET /api/cameras
 * @access  Private
 */
const getCameras = asyncHandler(async (req, res) => {
  const { status, zone, type, page = 1, limit = 20 } = req.query;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (zone) filter['location.zone'] = zone;
  if (type) filter.type = type;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [cameras, total] = await Promise.all([
    Camera.find(filter)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Camera.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Cameras retrieved',
    data: {
      cameras,
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
 * @desc    Get single camera by ID
 * @route   GET /api/cameras/:id
 * @access  Private
 */
const getCameraById = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id).populate('addedBy', 'name email');

  if (!camera) {
    throw new ApiError(404, 'Camera not found');
  }

  res.status(200).json({
    success: true,
    message: 'Camera retrieved',
    data: { camera },
  });
});

/**
 * @desc    Create a new camera
 * @route   POST /api/cameras
 * @access  Private (Admin)
 */
const createCamera = asyncHandler(async (req, res) => {
  const { name, location, streamUrl, type, status, resolution } = req.body;

  if (!name) {
    throw new ApiError(400, 'Camera name is required');
  }

  const camera = await Camera.create({
    name,
    location,
    streamUrl,
    type,
    status,
    resolution,
    addedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Camera created successfully',
    data: { camera },
  });
});

/**
 * @desc    Update a camera
 * @route   PUT /api/cameras/:id
 * @access  Private (Admin)
 */
const updateCamera = asyncHandler(async (req, res) => {
  const { name, location, streamUrl, type, status, resolution } = req.body;

  const camera = await Camera.findById(req.params.id);

  if (!camera) {
    throw new ApiError(404, 'Camera not found');
  }

  // Update only provided fields
  if (name !== undefined) camera.name = name;
  if (location !== undefined) camera.location = { ...camera.location.toObject?.() ?? camera.location, ...location };
  if (streamUrl !== undefined) camera.streamUrl = streamUrl;
  if (type !== undefined) camera.type = type;
  if (status !== undefined) camera.status = status;
  if (resolution !== undefined) camera.resolution = resolution;

  await camera.save();

  res.status(200).json({
    success: true,
    message: 'Camera updated successfully',
    data: { camera },
  });
});

/**
 * @desc    Delete a camera
 * @route   DELETE /api/cameras/:id
 * @access  Private (Admin)
 */
const deleteCamera = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id);

  if (!camera) {
    throw new ApiError(404, 'Camera not found');
  }

  await camera.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Camera deleted successfully',
    data: {},
  });
});

module.exports = { getCameras, getCameraById, createCamera, updateCamera, deleteCamera };

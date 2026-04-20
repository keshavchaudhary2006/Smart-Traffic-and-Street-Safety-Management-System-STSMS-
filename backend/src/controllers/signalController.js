/**
 * ============================================
 * STSMS — Smart Traffic Signal Controller
 * ============================================
 * Orchestrates 4-way intersection signal states, dynamic AI green-wave
 * duration allocation, and emergency corridor overrides.
 */

const TrafficSignal = require('../models/TrafficSignal');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  calculateTrafficDensity,
  calculateDynamicGreenTime,
  calculateIntersectionSplits,
  YELLOW_LIGHT_DURATION,
  ALL_RED_CLEARANCE,
} = require('../utils/trafficDensity');

/**
 * Helper: Default intersection blueprint used for seeding
 */
const DEFAULT_INTERSECTION_SEED = {
  name: 'Broadway & 5th Ave Smart Intersection',
  zone: 'Zone-A (Downtown Corridor)',
  location: {
    address: 'Broadway & 5th Ave Crossing',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  mode: 'dynamic_ai',
  activePhase: 'NORTH_SOUTH',
  cycleCount: 142,
  approaches: {
    north: { state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 8, pcu: 9, lanes: 2 },
    south: { state: 'GREEN', timer: 20, allocatedGreen: 20, density: 'LOW', vehicleCount: 11, pcu: 12, lanes: 2 },
    east: { state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 5, pcu: 5.5, lanes: 2 },
    west: { state: 'RED', timer: 26, allocatedGreen: 20, density: 'LOW', vehicleCount: 6, pcu: 6, lanes: 2 },
  },
};

/**
 * @desc    Get all smart traffic signals (auto-seeds default if empty)
 * @route   GET /api/signals
 * @access  Private
 */
const getSignals = asyncHandler(async (req, res) => {
  let signals = await TrafficSignal.find().sort({ createdAt: -1 });

  if (signals.length === 0) {
    const defaultSignal = await TrafficSignal.create(DEFAULT_INTERSECTION_SEED);
    signals = [defaultSignal];
  }

  res.status(200).json({
    success: true,
    message: 'Traffic signals retrieved',
    data: { signals },
  });
});

/**
 * @desc    Get single traffic signal by ID
 * @route   GET /api/signals/:id
 * @access  Private
 */
const getSignalById = asyncHandler(async (req, res) => {
  const signal = await TrafficSignal.findById(req.params.id);

  if (!signal) {
    throw new ApiError(404, 'Traffic signal intersection not found');
  }

  // Calculate live intersection split analysis
  const splitAnalysis = calculateIntersectionSplits({
    north: signal.approaches.north,
    south: signal.approaches.south,
    east: signal.approaches.east,
    west: signal.approaches.west,
  });

  res.status(200).json({
    success: true,
    message: 'Traffic signal retrieved',
    data: {
      signal,
      splitAnalysis,
    },
  });
});

/**
 * @desc    Create a new smart intersection signal
 * @route   POST /api/signals
 * @access  Private (Admin)
 */
const createSignal = asyncHandler(async (req, res) => {
  const { name, zone, location, approaches } = req.body;

  if (!name) {
    throw new ApiError(400, 'Intersection name is required');
  }

  const signal = await TrafficSignal.create({
    name,
    zone: zone || 'Zone-A',
    location,
    approaches: approaches || DEFAULT_INTERSECTION_SEED.approaches,
  });

  res.status(201).json({
    success: true,
    message: 'Smart traffic signal created',
    data: { signal },
  });
});

/**
 * @desc    Simulate vehicle queue injection and recalculate dynamic green times
 * @route   POST /api/signals/:id/simulate
 * @access  Private
 */
const simulateTrafficFlow = asyncHandler(async (req, res) => {
  const { direction, vehicleCount, counts } = req.body;
  const signal = await TrafficSignal.findById(req.params.id);

  if (!signal) {
    throw new ApiError(404, 'Traffic signal not found');
  }

  const validDirs = ['north', 'south', 'east', 'west'];

  if (direction && validDirs.includes(direction)) {
    // Update specific approach
    const approach = signal.approaches[direction];
    const newCount = vehicleCount !== undefined ? vehicleCount : approach.vehicleCount + 15;
    const densityResult = calculateTrafficDensity(counts || newCount, approach.lanes || 2);
    const dynamicGreen = calculateDynamicGreenTime(densityResult.category, densityResult.densityIndex);

    approach.vehicleCount = newCount;
    approach.pcu = densityResult.pcu;
    approach.density = densityResult.category;
    approach.allocatedGreen = dynamicGreen;

    // If currently GREEN, update active timer to match new allocation
    if (approach.state === 'GREEN') {
      approach.timer = Math.max(approach.timer, dynamicGreen);
    }
  } else {
    // Simulate random realistic density shift across all 4 corridors
    validDirs.forEach((dir) => {
      const approach = signal.approaches[dir];
      const delta = Math.floor(Math.random() * 18) - 4; // -4 to +14 vehicle delta
      const count = Math.max(2, approach.vehicleCount + delta);
      const densityResult = calculateTrafficDensity(count, approach.lanes || 2);
      const dynamicGreen = calculateDynamicGreenTime(densityResult.category, densityResult.densityIndex);

      approach.vehicleCount = count;
      approach.pcu = densityResult.pcu;
      approach.density = densityResult.category;
      approach.allocatedGreen = dynamicGreen;
    });
  }

  await signal.save();

  res.status(200).json({
    success: true,
    message: 'Traffic simulation updated and dynamic timings recalculated',
    data: { signal },
  });
});

/**
 * @desc    Advance intersection phase with dynamic green duration based on density
 * @route   POST /api/signals/:id/transition
 * @access  Private
 */
const transitionPhase = asyncHandler(async (req, res) => {
  const signal = await TrafficSignal.findById(req.params.id);

  if (!signal) {
    throw new ApiError(404, 'Traffic signal not found');
  }

  const { activePhase, approaches } = signal;

  // Calculate dynamic green splits for each corridor
  const nsDensityNorth = calculateTrafficDensity(approaches.north.vehicleCount, approaches.north.lanes);
  const nsDensitySouth = calculateTrafficDensity(approaches.south.vehicleCount, approaches.south.lanes);
  const nsGreen = Math.max(
    calculateDynamicGreenTime(nsDensityNorth.category, nsDensityNorth.densityIndex),
    calculateDynamicGreenTime(nsDensitySouth.category, nsDensitySouth.densityIndex)
  );

  const ewDensityEast = calculateTrafficDensity(approaches.east.vehicleCount, approaches.east.lanes);
  const ewDensityWest = calculateTrafficDensity(approaches.west.vehicleCount, approaches.west.lanes);
  const ewGreen = Math.max(
    calculateDynamicGreenTime(ewDensityEast.category, ewDensityEast.densityIndex),
    calculateDynamicGreenTime(ewDensityWest.category, ewDensityWest.densityIndex)
  );

  if (activePhase === 'NORTH_SOUTH') {
    // Switch North-South to RED, East-West to GREEN with dynamic timing
    approaches.north.state = 'RED';
    approaches.south.state = 'RED';
    approaches.north.timer = ewGreen + YELLOW_LIGHT_DURATION + ALL_RED_CLEARANCE;
    approaches.south.timer = ewGreen + YELLOW_LIGHT_DURATION + ALL_RED_CLEARANCE;

    approaches.east.state = 'GREEN';
    approaches.west.state = 'GREEN';
    approaches.east.allocatedGreen = ewGreen;
    approaches.west.allocatedGreen = ewGreen;
    approaches.east.timer = ewGreen;
    approaches.west.timer = ewGreen;

    // Simulate clearance of vehicles on old phase
    approaches.north.vehicleCount = Math.max(2, Math.round(approaches.north.vehicleCount * 0.3));
    approaches.south.vehicleCount = Math.max(2, Math.round(approaches.south.vehicleCount * 0.3));

    signal.activePhase = 'EAST_WEST';
  } else {
    // Switch East-West to RED, North-South to GREEN with dynamic timing
    approaches.east.state = 'RED';
    approaches.west.state = 'RED';
    approaches.east.timer = nsGreen + YELLOW_LIGHT_DURATION + ALL_RED_CLEARANCE;
    approaches.west.timer = nsGreen + YELLOW_LIGHT_DURATION + ALL_RED_CLEARANCE;

    approaches.north.state = 'GREEN';
    approaches.south.state = 'GREEN';
    approaches.north.allocatedGreen = nsGreen;
    approaches.south.allocatedGreen = nsGreen;
    approaches.north.timer = nsGreen;
    approaches.south.timer = nsGreen;

    // Simulate clearance of vehicles on old phase
    approaches.east.vehicleCount = Math.max(2, Math.round(approaches.east.vehicleCount * 0.3));
    approaches.west.vehicleCount = Math.max(2, Math.round(approaches.west.vehicleCount * 0.3));

    signal.activePhase = 'NORTH_SOUTH';
    signal.cycleCount += 1;
  }

  signal.lastSwitchedAt = new Date();
  await signal.save();

  res.status(200).json({
    success: true,
    message: `Phase switched to ${signal.activePhase} with dynamic duration`,
    data: { signal },
  });
});

/**
 * @desc    Trigger emergency vehicle corridor override (Green-Wave)
 * @route   PATCH /api/signals/:id/emergency
 * @access  Private
 */
const triggerEmergencyOverride = asyncHandler(async (req, res) => {
  const { corridor = 'north', vehicleType = 'Ambulance' } = req.body;
  const signal = await TrafficSignal.findById(req.params.id);

  if (!signal) {
    throw new ApiError(404, 'Traffic signal not found');
  }

  const validCorridors = ['north', 'south', 'east', 'west'];
  if (!validCorridors.includes(corridor)) {
    throw new ApiError(400, 'Invalid emergency corridor direction');
  }

  // Set all to RED except the emergency corridor
  validCorridors.forEach((dir) => {
    if (dir === corridor) {
      signal.approaches[dir].state = 'GREEN';
      signal.approaches[dir].timer = 60; // 60s emergency window
      signal.approaches[dir].allocatedGreen = 60;
    } else {
      signal.approaches[dir].state = 'RED';
      signal.approaches[dir].timer = 60;
    }
  });

  signal.mode = 'emergency_override';
  signal.emergency = {
    active: true,
    corridor,
    vehicleType,
    startedAt: new Date(),
  };

  await signal.save();

  res.status(200).json({
    success: true,
    message: `🚨 Emergency override active: ${corridor.toUpperCase()} corridor cleared for ${vehicleType}`,
    data: { signal },
  });
});

/**
 * @desc    Reset emergency override back to Dynamic AI Mode
 * @route   DELETE /api/signals/:id/emergency
 * @access  Private
 */
const resetEmergencyOverride = asyncHandler(async (req, res) => {
  const signal = await TrafficSignal.findById(req.params.id);

  if (!signal) {
    throw new ApiError(404, 'Traffic signal not found');
  }

  signal.mode = 'dynamic_ai';
  signal.emergency = {
    active: false,
    corridor: null,
    vehicleType: null,
    startedAt: null,
  };

  // Re-initialize standard North-South Green phase
  signal.approaches.north.state = 'GREEN';
  signal.approaches.south.state = 'GREEN';
  signal.approaches.north.timer = 25;
  signal.approaches.south.timer = 25;

  signal.approaches.east.state = 'RED';
  signal.approaches.west.state = 'RED';
  signal.approaches.east.timer = 31;
  signal.approaches.west.timer = 31;

  signal.activePhase = 'NORTH_SOUTH';
  await signal.save();

  res.status(200).json({
    success: true,
    message: 'Emergency override dismissed. Dynamic AI signal management resumed.',
    data: { signal },
  });
});

module.exports = {
  getSignals,
  getSignalById,
  createSignal,
  simulateTrafficFlow,
  transitionPhase,
  triggerEmergencyOverride,
  resetEmergencyOverride,
};

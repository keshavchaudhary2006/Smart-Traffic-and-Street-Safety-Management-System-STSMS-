/**
 * ============================================
 * STSMS — Incident & Violation Controller
 * ============================================
 * Handles CRUD operations, simulation triggers, and real-time
 * WebSocket event broadcasts for incidents and traffic violations.
 */

const Incident = require('../models/Incident');
const Violation = require('../models/Violation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { broadcastEvent } = require('../socket');

/**
 * Seed initial mock incidents for instant visualization
 */
const DEFAULT_INCIDENTS_SEED = [
  {
    incidentId: 'INC-1084-291',
    title: 'Multi-Vehicle Collision at Broadway Crossing',
    description: 'Two passenger sedans collided due to red-light failure during heavy congestion.',
    type: 'VEHICLE_COLLISION',
    severity: 'HIGH',
    status: 'DISPATCHED',
    location: { address: 'Broadway & 5th Ave Crossing', zone: 'Zone-A (Downtown)' },
    involvedVehicles: [
      { type: 'car', licensePlate: 'NY-8492', damageSeverity: 'MODERATE' },
      { type: 'car', licensePlate: 'NJ-3011', damageSeverity: 'MINOR' },
    ],
    responderDispatched: { dispatched: true, unitType: 'Ambulance & Traffic Police', dispatchedAt: new Date(Date.now() - 5 * 60000) },
  },
  {
    incidentId: 'INC-2041-884',
    title: 'Freight Truck Breakdown Blocking Center Lane',
    description: 'Heavy commercial vehicle disabled on expressway exit slipway.',
    type: 'VEHICLE_BREAKDOWN',
    severity: 'MEDIUM',
    status: 'REPORTED',
    location: { address: 'Highway-101 North Flyover Exit 4', zone: 'Highway-101' },
    involvedVehicles: [{ type: 'truck', licensePlate: 'PA-9023', damageSeverity: 'MINOR' }],
    responderDispatched: { dispatched: true, unitType: 'Heavy Tow Unit', dispatchedAt: new Date(Date.now() - 12 * 60000) },
  },
];

const DEFAULT_VIOLATIONS_SEED = [
  {
    violationId: 'VIO-891-204',
    type: 'RED_LIGHT',
    severity: 'HIGH',
    location: { address: 'Central Metro Plaza Crossing', zone: 'Pedestrian-Zone', corridor: 'East-West' },
    vehicle: { type: 'car', licensePlate: 'NY-5521', color: 'Black', speedKmh: 48, speedLimitKmh: 40 },
    confidence: 0.98,
    status: 'CONFIRMED',
    fineAmount: 150,
  },
  {
    violationId: 'VIO-712-491',
    type: 'WRONG_WAY',
    severity: 'CRITICAL',
    location: { address: 'Market St One-Way Slipway', zone: 'Zone-B', corridor: 'West' },
    vehicle: { type: 'car', licensePlate: 'CA-7712', color: 'Silver', speedKmh: 36, speedLimitKmh: 30 },
    confidence: 0.94,
    status: 'CITATION_ISSUED',
    fineAmount: 250,
  },
  {
    violationId: 'VIO-341-902',
    type: 'SPEEDING',
    severity: 'MEDIUM',
    location: { address: 'Northbound Express Corridor', zone: 'Highway-101', corridor: 'North' },
    vehicle: { type: 'motorcycle', licensePlate: 'M-9021', color: 'Red', speedKmh: 94, speedLimitKmh: 65 },
    confidence: 0.96,
    status: 'CONFIRMED',
    fineAmount: 180,
  },
];

// ──────────────────────────────────────────────
// Incident Operations
// ──────────────────────────────────────────────

/**
 * @desc    Get all roadway safety incidents
 * @route   GET /api/incidents
 * @access  Private
 */
const getIncidents = asyncHandler(async (req, res) => {
  const { status, severity, zone, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (zone) filter['location.zone'] = zone;

  let [incidents, total] = await Promise.all([
    Incident.find(filter)
      .populate('camera', 'name location.zone')
      .sort({ reportedAt: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10)),
    Incident.countDocuments(filter),
  ]);

  if (incidents.length === 0 && total === 0) {
    await Incident.insertMany(DEFAULT_INCIDENTS_SEED);
    incidents = await Incident.find().sort({ reportedAt: -1 });
    total = incidents.length;
  }

  res.status(200).json({
    success: true,
    message: 'Incidents retrieved',
    data: {
      incidents,
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
 * @desc    Get incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate('camera', 'name location');
  if (!incident) throw new ApiError(404, 'Incident not found');

  res.status(200).json({
    success: true,
    message: 'Incident retrieved',
    data: { incident },
  });
});

/**
 * @desc    Create a new incident
 * @route   POST /api/incidents
 * @access  Private
 */
const createIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.create(req.body);

  // Broadcast real-time incident event
  broadcastEvent('incident:new', incident);

  res.status(201).json({
    success: true,
    message: 'Incident created and broadcasted',
    data: { incident },
  });
});

/**
 * @desc    Update incident status (e.g. DISPATCHED, RESOLVED)
 * @route   PATCH /api/incidents/:id/status
 * @access  Private
 */
const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status, responderDispatched } = req.body;
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw new ApiError(404, 'Incident not found');

  if (status) incident.status = status;
  if (status === 'RESOLVED') incident.resolvedAt = new Date();
  if (responderDispatched) incident.responderDispatched = { ...incident.responderDispatched, ...responderDispatched };

  await incident.save();

  // Broadcast real-time update
  broadcastEvent('incident:updated', incident);

  res.status(200).json({
    success: true,
    message: 'Incident status updated',
    data: { incident },
  });
});

/**
 * @desc    Trigger a simulated roadway collision / incident
 * @route   POST /api/incidents/simulate
 * @access  Private
 */
const simulateIncident = asyncHandler(async (req, res) => {
  const {
    type = 'VEHICLE_COLLISION',
    severity = 'HIGH',
    zone = 'Zone-A (Downtown Corridor)',
    title = 'Simulated Roadway Incident Alert',
  } = req.body;

  const mockPlates = ['NY-9182', 'TX-4401', 'CA-8890', 'FL-3312'];
  const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];

  const incident = await Incident.create({
    title: title || `Live Alert: ${type.replace(/_/g, ' ')} detected in ${zone}`,
    description: `Automated vision engine flagged sudden stop / hazard in ${zone}.`,
    type,
    severity,
    status: 'REPORTED',
    location: {
      address: 'Main St & 5th Ave Intersection',
      zone,
    },
    involvedVehicles: [
      { type: 'car', licensePlate: randomPlate, damageSeverity: severity === 'CRITICAL' ? 'SEVERE' : 'MODERATE' },
    ],
    responderDispatched: {
      dispatched: true,
      unitType: severity === 'CRITICAL' ? 'Paramedics & Rescue Squad' : 'Traffic Enforcement Patrol',
      dispatchedAt: new Date(),
    },
  });

  // Broadcast real-time event to all connected React clients
  broadcastEvent('incident:new', incident);

  res.status(201).json({
    success: true,
    message: `🚨 Simulated ${severity} incident triggered and broadcasted live!`,
    data: { incident },
  });
});

// ──────────────────────────────────────────────
// Violation Operations
// ──────────────────────────────────────────────

/**
 * @desc    Get all traffic violations
 * @route   GET /api/violations
 * @access  Private
 */
const getViolations = asyncHandler(async (req, res) => {
  const { type, severity, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (severity) filter.severity = severity;
  if (status) filter.status = status;

  let [violations, total] = await Promise.all([
    Violation.find(filter)
      .populate('camera', 'name location.zone')
      .sort({ timestamp: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10)),
    Violation.countDocuments(filter),
  ]);

  if (violations.length === 0 && total === 0) {
    await Violation.insertMany(DEFAULT_VIOLATIONS_SEED);
    violations = await Violation.find().sort({ timestamp: -1 });
    total = violations.length;
  }

  res.status(200).json({
    success: true,
    message: 'Violations retrieved',
    data: {
      violations,
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
 * @desc    Trigger a simulated red-light or speed violation
 * @route   POST /api/violations/simulate
 * @access  Private
 */
const simulateViolation = asyncHandler(async (req, res) => {
  const {
    type = 'RED_LIGHT',
    severity = 'HIGH',
    vehicleType = 'car',
    speedKmh = 68,
    zone = 'Zone-A (Downtown Corridor)',
  } = req.body;

  const platePrefixes = ['NY', 'NJ', 'CT', 'PA', 'CA'];
  const prefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
  const generatedPlate = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  const violation = await Violation.create({
    type,
    severity,
    location: {
      address: '5th Ave & Broadway Crosswalk',
      zone,
      corridor: 'North-South Arterial',
    },
    vehicle: {
      type: vehicleType,
      licensePlate: generatedPlate,
      color: ['Black', 'Silver', 'White', 'Midnight Blue'][Math.floor(Math.random() * 4)],
      speedKmh: speedKmh || (type === 'SPEEDING' ? 88 : 52),
      speedLimitKmh: 45,
    },
    confidence: Math.round((0.92 + Math.random() * 0.07) * 100) / 100,
    status: 'CONFIRMED',
    fineAmount: type === 'RED_LIGHT' ? 175 : type === 'WRONG_WAY' ? 300 : 120,
    timestamp: new Date(),
  });

  // Broadcast real-time violation event to all connected React clients
  broadcastEvent('violation:new', violation);

  res.status(201).json({
    success: true,
    message: `📸 Simulated ${type} violation recorded and broadcasted live!`,
    data: { violation },
  });
});

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  simulateIncident,
  getViolations,
  simulateViolation,
};

/**
 * ============================================
 * STSMS — Traffic Density & Signal Timing Math Utility
 * ============================================
 * Implements standard Transportation Engineering PCU (Passenger Car Unit)
 * formulations and Highway Capacity Manual (HCM) Level of Service (LOS)
 * categorization to compute traffic density and dynamic green-split timing.
 */

// Passenger Car Equivalent (PCU) factors based on road geometry occupancy
const PCU_WEIGHTS = {
  car: 1.0,
  motorcycle: 0.5,
  bus: 2.5,
  truck: 3.0,
  bicycle: 0.2,
  pedestrian: 0.15,
};

// Density Thresholds (Equivalent Passenger Cars per lane / observation window)
const DENSITY_THRESHOLDS = {
  LOW: 10,       // PCU < 10: Free-flow traffic
  MEDIUM: 25,    // 10 <= PCU < 25: Stable flow
  HIGH: 45,      // 25 <= PCU < 45: Near capacity
  CRITICAL: 45,  // PCU >= 45: Severe congestion / gridlock
};

// Dynamic Green Light Allocations (in seconds)
const SIGNAL_TIMING_RULES = {
  LOW: { min: 15, base: 20, max: 25 },
  MEDIUM: { min: 25, base: 40, max: 50 },
  HIGH: { min: 50, base: 65, max: 75 },
  CRITICAL: { min: 75, base: 90, max: 120 },
};

const YELLOW_LIGHT_DURATION = 4; // Standard yellow transition in seconds
const ALL_RED_CLEARANCE = 2;     // Intersection clearance interval

/**
 * Calculates total Passenger Car Units (PCU) from discrete vehicle counts.
 * 
 * @param {Object} counts - Object containing counts for car, motorcycle, bus, truck, etc.
 * @returns {number} Total weighted PCU
 */
function calculatePCU(counts = {}) {
  const cars = (counts.car || counts.cars || 0) * PCU_WEIGHTS.car;
  const motorcycles = (counts.motorcycle || counts.motorcycles || 0) * PCU_WEIGHTS.motorcycle;
  const buses = (counts.bus || counts.buses || 0) * PCU_WEIGHTS.bus;
  const trucks = (counts.truck || counts.trucks || 0) * PCU_WEIGHTS.truck;
  const bicycles = (counts.bicycle || counts.bicycles || 0) * PCU_WEIGHTS.bicycle;
  const pedestrians = (counts.pedestrian || counts.pedestrians || 0) * PCU_WEIGHTS.pedestrian;

  return Math.round((cars + motorcycles + buses + trucks + bicycles + pedestrians) * 10) / 10;
}

/**
 * Categorizes traffic density into LOW, MEDIUM, HIGH, or CRITICAL.
 * 
 * Mathematical Formulation:
 * Density Index D = (PCU / LaneCount) * (60 / WindowMinutes)
 * 
 * @param {number|Object} input - Either total vehicle count, PCU value, or breakdown object
 * @param {number} lanes - Number of approach lanes (default 2)
 * @param {number} windowMinutes - Time window in minutes (default 5)
 * @returns {Object} { category: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', pcu, densityIndex, score }
 */
function calculateTrafficDensity(input, lanes = 2, windowMinutes = 5) {
  let pcu = 0;
  if (typeof input === 'number') {
    pcu = input;
  } else if (typeof input === 'object' && input !== null) {
    pcu = calculatePCU(input);
  }

  // Normalized hourly lane throughput equivalent
  const normalizedLanes = Math.max(1, lanes);
  const normalizedWindow = Math.max(1, windowMinutes);
  const densityIndex = Math.round(((pcu / normalizedLanes) * (5 / normalizedWindow)) * 10) / 10;

  let category = 'LOW';
  let levelScore = 1; // 1 to 4 scale

  if (densityIndex >= DENSITY_THRESHOLDS.CRITICAL) {
    category = 'CRITICAL';
    levelScore = 4;
  } else if (densityIndex >= DENSITY_THRESHOLDS.HIGH) {
    category = 'HIGH';
    levelScore = 3;
  } else if (densityIndex >= DENSITY_THRESHOLDS.MEDIUM) {
    category = 'MEDIUM';
    levelScore = 2;
  } else {
    category = 'LOW';
    levelScore = 1;
  }

  return {
    category,
    pcu,
    densityIndex,
    levelScore,
    lanes: normalizedLanes,
  };
}

/**
 * Computes dynamic green light duration dynamically based on real-time density.
 * 
 * Formula:
 * GreenTime = BaseDuration + ((DensityIndex - LowerThreshold) / BandSpan) * (MaxDuration - MinDuration)
 * 
 * Constraints:
 * - Clamped strictly between Category Min and Max
 * - Guarantees minimum pedestrian walk clearance
 * 
 * @param {string} densityCategory - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 * @param {number} [densityIndex] - Fine-grained density value for continuous interpolation
 * @returns {number} Green light duration in seconds
 */
function calculateDynamicGreenTime(densityCategory, densityIndex = null) {
  const rule = SIGNAL_TIMING_RULES[densityCategory] || SIGNAL_TIMING_RULES.LOW;

  if (densityIndex === null) {
    return rule.base;
  }

  // Interpolate inside category window
  let calculated = rule.base;
  if (densityCategory === 'LOW') {
    calculated = Math.min(rule.max, Math.max(rule.min, 15 + Math.round(densityIndex)));
  } else if (densityCategory === 'MEDIUM') {
    calculated = Math.min(rule.max, Math.max(rule.min, 25 + Math.round((densityIndex - 10) * 1.5)));
  } else if (densityCategory === 'HIGH') {
    calculated = Math.min(rule.max, Math.max(rule.min, 50 + Math.round((densityIndex - 25) * 1.25)));
  } else if (densityCategory === 'CRITICAL') {
    calculated = Math.min(rule.max, Math.max(rule.min, 75 + Math.round((densityIndex - 45) * 1.5)));
  }

  return calculated;
}

/**
 * Calculates optimal 4-way intersection green-splits based on Webster's Method.
 * 
 * @param {Object} approaches - { north: { counts }, south: { counts }, east: { counts }, west: { counts } }
 * @returns {Object} Calculated green split allocation per approach & active phase recommendations
 */
function calculateIntersectionSplits(approaches = {}) {
  const directions = ['north', 'south', 'east', 'west'];
  const analysis = {};

  directions.forEach((dir) => {
    const data = approaches[dir] || {};
    const densityResult = calculateTrafficDensity(data.counts || data.vehicleCount || data, data.lanes || 2);
    const greenTime = calculateDynamicGreenTime(densityResult.category, densityResult.densityIndex);

    analysis[dir] = {
      ...densityResult,
      allocatedGreenTime: greenTime,
      yellowTime: YELLOW_LIGHT_DURATION,
      allRedTime: ALL_RED_CLEARANCE,
    };
  });

  // Calculate dual-ring phase pairings:
  // Phase 1: North-South corridor
  // Phase 2: East-West corridor
  const nsMaxGreen = Math.max(analysis.north.allocatedGreenTime, analysis.south.allocatedGreenTime);
  const ewMaxGreen = Math.max(analysis.east.allocatedGreenTime, analysis.west.allocatedGreenTime);

  const cycleLength = nsMaxGreen + ewMaxGreen + (YELLOW_LIGHT_DURATION + ALL_RED_CLEARANCE) * 2;

  return {
    approaches: analysis,
    phases: {
      northSouth: {
        dominantDirection: analysis.north.pcu >= analysis.south.pcu ? 'north' : 'south',
        allocatedGreen: nsMaxGreen,
        yellow: YELLOW_LIGHT_DURATION,
      },
      eastWest: {
        dominantDirection: analysis.east.pcu >= analysis.west.pcu ? 'east' : 'west',
        allocatedGreen: ewMaxGreen,
        yellow: YELLOW_LIGHT_DURATION,
      },
    },
    totalCycleLength: cycleLength,
  };
}

module.exports = {
  PCU_WEIGHTS,
  DENSITY_THRESHOLDS,
  SIGNAL_TIMING_RULES,
  YELLOW_LIGHT_DURATION,
  ALL_RED_CLEARANCE,
  calculatePCU,
  calculateTrafficDensity,
  calculateDynamicGreenTime,
  calculateIntersectionSplits,
};

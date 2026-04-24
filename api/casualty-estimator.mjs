/**
 * Casualty Estimation Module
 *
 * Implements semi-quantitative fatality and injury estimation based on
 * depth × velocity matrix from established flood risk research.
 *
 * Sources:
 * - Jonkman, S.N. et al. (2008). Loss of life estimation in flood risk assessment.
 * - USBR (2015). RCEM – Reclamation Consequence Estimating Methodology.
 * - Defra/Environment Agency (2006). Flood Risks to People – Phase 2.
 */

/**
 * Depth bin ranges for mortality factor lookup
 */
const DEPTH_RANGES = {
  SHALLOW: 'shallow',    // < 1m
  MEDIUM_1: 'medium_1',  // 1-2m
  MEDIUM_2: 'medium_2',  // 2-3m
  DEEP: 'deep',          // > 3m
};

/**
 * Velocity classes for mortality factor lookup
 */
const VELOCITY_CLASSES = {
  LOW: 'low',        // < 0.5 m/s
  MODERATE: 'moderate', // 0.5-1.5 m/s
  HIGH: 'high',      // > 1.5 m/s
};

/**
 * Base mortality factors (fraction of exposed population)
 * Format: [low, moderate, high] estimates
 *
 * From Jonkman et al. (2008), USBR RCEM, Defra FD2321
 */
const MORTALITY_FACTORS = {
  [DEPTH_RANGES.SHALLOW]: {
    [VELOCITY_CLASSES.LOW]: [0.0001, 0.0005, 0.001],      // 0.01% - 0.1%
    [VELOCITY_CLASSES.MODERATE]: [0.0005, 0.001, 0.002],  // 0.05% - 0.2%
    [VELOCITY_CLASSES.HIGH]: [0.001, 0.002, 0.005],       // 0.1% - 0.5%
  },
  [DEPTH_RANGES.MEDIUM_1]: {
    [VELOCITY_CLASSES.LOW]: [0.001, 0.002, 0.005],        // 0.1% - 0.5%
    [VELOCITY_CLASSES.MODERATE]: [0.002, 0.005, 0.01],    // 0.2% - 1.0%
    [VELOCITY_CLASSES.HIGH]: [0.005, 0.01, 0.02],         // 0.5% - 2.0%
  },
  [DEPTH_RANGES.MEDIUM_2]: {
    [VELOCITY_CLASSES.LOW]: [0.002, 0.005, 0.01],         // 0.2% - 1.0%
    [VELOCITY_CLASSES.MODERATE]: [0.005, 0.01, 0.025],    // 0.5% - 2.5%
    [VELOCITY_CLASSES.HIGH]: [0.01, 0.025, 0.05],         // 1.0% - 5.0%
  },
  [DEPTH_RANGES.DEEP]: {
    [VELOCITY_CLASSES.LOW]: [0.01, 0.025, 0.05],          // 1.0% - 5.0%
    [VELOCITY_CLASSES.MODERATE]: [0.01, 0.025, 0.05],     // 1.0% - 5.0%
    [VELOCITY_CLASSES.HIGH]: [0.01, 0.025, 0.05],         // 1.0% - 5.0%
  },
};

/**
 * Special mortality factor for V×h > 1.5 m²/s (hazard threshold)
 * Applies regardless of depth
 */
const VH_EXCEED_MORTALITY = [0.025, 0.05, 0.10]; // 2.5% - 10%

/**
 * Injury rate multiplier (injuries ≈ 3× fatalities per international convention)
 */
const INJURY_MULTIPLIER = 3;

/**
 * Duration modifiers (multiplied with base estimates)
 */
const DURATION_MODIFIERS = {
  SHORT: 1.5,   // Flash flood (<6h) - higher risk due to sudden onset
  MEDIUM: 1.0,  // Normal (6-24h)
  LONG: 1.2,    // Prolonged (>24h) - reduced rescue access
};

/**
 * Risk level classification thresholds
 */
const RISK_THRESHOLDS = {
  VERY_LOW: { count: 10, percentage: 0.01 },
  LOW: { count: 50, percentage: 0.05 },
  MODERATE: { count: 200, percentage: 0.2 },
  HIGH: { count: 1000, percentage: 1.0 },
};

/**
 * Determine depth range category from depth bin key
 */
function getDepthRange(depthBinKey) {
  if (depthBinKey.includes('15') || depthBinKey.includes('100cm')) {
    return DEPTH_RANGES.SHALLOW;
  }
  if (depthBinKey.includes('1-2')) {
    return DEPTH_RANGES.MEDIUM_1;
  }
  if (depthBinKey.includes('2-3')) {
    return DEPTH_RANGES.MEDIUM_2;
  }
  // 3-4m, 4-5m, above5m all treated as DEEP
  return DEPTH_RANGES.DEEP;
}

/**
 * Get velocity class from velocity class key
 */
function getVelocityClass(velocityClassKey) {
  if (velocityClassKey.includes('low')) return VELOCITY_CLASSES.LOW;
  if (velocityClassKey.includes('moderate')) return VELOCITY_CLASSES.MODERATE;
  return VELOCITY_CLASSES.HIGH;
}

/**
 * Calculate duration modifier based on duration distribution
 * Returns the weighted average modifier
 */
function calculateDurationModifier(durShort, durMedium, durLong) {
  const total = durShort + durMedium + durLong;
  if (total === 0) return DURATION_MODIFIERS.MEDIUM;

  const shortWeight = durShort / total;
  const mediumWeight = durMedium / total;
  const longWeight = durLong / total;

  return (
    shortWeight * DURATION_MODIFIERS.SHORT +
    mediumWeight * DURATION_MODIFIERS.MEDIUM +
    longWeight * DURATION_MODIFIERS.LONG
  );
}

/**
 * Calculate casualties (fatalities and injuries) for a population segment
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.population - Population count
 * @param {string} params.depthBin - Depth bin key (e.g., "1-2m", "15-100cm")
 * @param {string} params.velocityClass - Velocity class (v_low, v_moderate, v_high)
 * @param {number} params.durationModifier - Duration modifier (1.0-1.5)
 * @param {boolean} params.isVhExceed - Whether V×h > 1.5 applies
 * @returns {Object} - { fatalities: CasualtyRange, injuries: CasualtyRange }
 */
function calculateSegmentCasualties({
  population,
  depthBin,
  velocityClass,
  durationModifier = 1.0,
  isVhExceed = false,
}) {
  const depthRange = getDepthRange(depthBin);
  const velClass = getVelocityClass(velocityClass);

  // Get base mortality factors
  let mortalityFactors = MORTALITY_FACTORS[depthRange]?.[velClass];
  if (!mortalityFactors) {
    mortalityFactors = MORTALITY_FACTORS[DEPTH_RANGES.SHALLOW][VELOCITY_CLASSES.LOW];
  }

  // Apply V×h exceedance if applicable (use higher factor)
  let baseFactors = mortalityFactors;
  if (isVhExceed) {
    // Use the higher of the two factors
    baseFactors = [
      Math.max(mortalityFactors[0], VH_EXCEED_MORTALITY[0]),
      Math.max(mortalityFactors[1], VH_EXCEED_MORTALITY[1]),
      Math.max(mortalityFactors[2], VH_EXCEED_MORTALITY[2]),
    ];
  }

  // Calculate fatalities
  const fatalities = {
    low: Math.round(population * baseFactors[0] * durationModifier),
    moderate: Math.round(population * baseFactors[1] * durationModifier),
    high: Math.round(population * baseFactors[2] * durationModifier),
  };

  // Calculate injuries (3× fatalities)
  const injuries = {
    low: Math.round(fatalities.low * INJURY_MULTIPLIER),
    moderate: Math.round(fatalities.moderate * INJURY_MULTIPLIER),
    high: Math.round(fatalities.high * INJURY_MULTIPLIER),
  };

  return { fatalities, injuries };
}

/**
 * Sum casualty ranges
 */
function sumCasualtyRanges(ranges) {
  if (!ranges || ranges.length === 0) {
    return { low: 0, moderate: 0, high: 0 };
  }

  return ranges.reduce(
    (sum, range) => {
      const fatalities = range?.fatalities;
      if (!fatalities) {
        return sum;
      }
      return {
        low: (sum.low || 0) + (fatalities.low || 0),
        moderate: (sum.moderate || 0) + (fatalities.moderate || 0),
        high: (sum.high || 0) + (fatalities.high || 0),
      };
    },
    { low: 0, moderate: 0, high: 0 }
  );
}

/**
 * Classify risk level based on fatality count and percentage
 */
function classifyRiskLevel(fatalities, affectedPopulation) {
  const percentage = affectedPopulation > 0 ? (fatalities / affectedPopulation) * 100 : 0;

  // Use moderate estimate for classification
  if (fatalities < RISK_THRESHOLDS.VERY_LOW.count || percentage < RISK_THRESHOLDS.VERY_LOW.percentage) {
    return 'very_low';
  }
  if (fatalities < RISK_THRESHOLDS.LOW.count || percentage < RISK_THRESHOLDS.LOW.percentage) {
    return 'low';
  }
  if (fatalities < RISK_THRESHOLDS.MODERATE.count || percentage < RISK_THRESHOLDS.MODERATE.percentage) {
    return 'moderate';
  }
  if (fatalities < RISK_THRESHOLDS.HIGH.count || percentage < RISK_THRESHOLDS.HIGH.percentage) {
    return 'high';
  }
  return 'very_high';
}

/**
 * Calculate duration modifier from depth × duration cross-tab
 */
function getDurationModifierFromCross(depthDurationCross) {
  let totalDurShort = 0;
  let totalDurMedium = 0;
  let totalDurLong = 0;

  // Sum all duration classes across depth bins
  Object.values(depthDurationCross).forEach((depthBin) => {
    totalDurShort += depthBin.d_short || 0;
    totalDurMedium += depthBin.d_medium || 0;
    totalDurLong += depthBin.d_long || 0;
  });

  return calculateDurationModifier(totalDurShort, totalDurMedium, totalDurLong);
}

/**
 * Calculate total casualties for a scenario
 *
 * @param {Object} scenarioData - Population hazard stats from database
 * @returns {Object} - Casualty estimation with ranges and key drivers
 */
function calculateScenarioCasualties(scenarioData) {
  const {
    total_affected_population,
    vel_low_depth_15_100cm, vel_low_depth_1_2m, vel_low_depth_2_3m, vel_low_depth_3_4m, vel_low_depth_4_5m, vel_low_depth_above5m,
    vel_moderate_depth_15_100cm, vel_moderate_depth_1_2m, vel_moderate_depth_2_3m, vel_moderate_depth_3_4m, vel_moderate_depth_4_5m, vel_moderate_depth_above5m,
    vel_high_depth_15_100cm, vel_high_depth_1_2m, vel_high_depth_2_3m, vel_high_depth_3_4m, vel_high_depth_4_5m, vel_high_depth_above5m,
    dur_short_depth_15_100cm, dur_short_depth_1_2m, dur_short_depth_2_3m, dur_short_depth_3_4m, dur_short_depth_4_5m, dur_short_depth_above5m,
    dur_medium_depth_15_100cm, dur_medium_depth_1_2m, dur_medium_depth_2_3m, dur_medium_depth_3_4m, dur_medium_depth_4_5m, dur_medium_depth_above5m,
    dur_long_depth_15_100cm, dur_long_depth_1_2m, dur_long_depth_2_3m, dur_long_depth_3_4m, dur_long_depth_4_5m, dur_long_depth_above5m,
    vh_exceed_population,
    depth_15_100cm, depth_1_2m, depth_2_3m, depth_3_4m, depth_4_5m, depth_above5m,
  } = scenarioData;

  // Build depth × velocity cross-tab from flat columns
  const depthVelocityCross = {
    '15-100cm': {
      v_low: vel_low_depth_15_100cm || 0,
      v_moderate: vel_moderate_depth_15_100cm || 0,
      v_high: vel_high_depth_15_100cm || 0,
    },
    '1-2m': {
      v_low: vel_low_depth_1_2m || 0,
      v_moderate: vel_moderate_depth_1_2m || 0,
      v_high: vel_high_depth_1_2m || 0,
    },
    '2-3m': {
      v_low: vel_low_depth_2_3m || 0,
      v_moderate: vel_moderate_depth_2_3m || 0,
      v_high: vel_high_depth_2_3m || 0,
    },
    '3-4m': {
      v_low: vel_low_depth_3_4m || 0,
      v_moderate: vel_moderate_depth_3_4m || 0,
      v_high: vel_high_depth_3_4m || 0,
    },
    '4-5m': {
      v_low: vel_low_depth_4_5m || 0,
      v_moderate: vel_moderate_depth_4_5m || 0,
      v_high: vel_high_depth_4_5m || 0,
    },
    'above5m': {
      v_low: vel_low_depth_above5m || 0,
      v_moderate: vel_moderate_depth_above5m || 0,
      v_high: vel_high_depth_above5m || 0,
    },
  };

  // Build depth × duration cross-tab for modifier calculation
  const depthDurationCross = {
    '15-100cm': {
      d_short: dur_short_depth_15_100cm || 0,
      d_medium: dur_medium_depth_15_100cm || 0,
      d_long: dur_long_depth_15_100cm || 0,
    },
    '1-2m': {
      d_short: dur_short_depth_1_2m || 0,
      d_medium: dur_medium_depth_1_2m || 0,
      d_long: dur_long_depth_1_2m || 0,
    },
    '2-3m': {
      d_short: dur_short_depth_2_3m || 0,
      d_medium: dur_medium_depth_2_3m || 0,
      d_long: dur_long_depth_2_3m || 0,
    },
    '3-4m': {
      d_short: dur_short_depth_3_4m || 0,
      d_medium: dur_medium_depth_3_4m || 0,
      d_long: dur_long_depth_3_4m || 0,
    },
    '4-5m': {
      d_short: dur_short_depth_4_5m || 0,
      d_medium: dur_medium_depth_4_5m || 0,
      d_long: dur_long_depth_4_5m || 0,
    },
    'above5m': {
      d_short: dur_short_depth_above5m || 0,
      d_medium: dur_medium_depth_above5m || 0,
      d_long: dur_long_depth_above5m || 0,
    },
  };

  // Calculate duration modifier
  const durationModifier = getDurationModifierFromCross(depthDurationCross);

  // Depth bins for key driver analysis
  const depthBins = {
    '15-100cm': depth_15_100cm || 0,
    '1-2m': depth_1_2m || 0,
    '2-3m': depth_2_3m || 0,
    '3-4m': depth_3_4m || 0,
    '4-5m': depth_4_5m || 0,
    'above5m': depth_above5m || 0,
  };

  // Calculate casualties for each depth × velocity segment
  const segmentCasualties = [];
  const vhExceed = vh_exceed_population || 0;

  for (const [depthBin, velocities] of Object.entries(depthVelocityCross)) {
    for (const [velClass, population] of Object.entries(velocities)) {
      if (population > 0) {
        segmentCasualties.push(
          calculateSegmentCasualties({
            population,
            depthBin,
            velocityClass: velClass,
            durationModifier,
            isVhExceed: vhExceed > 0,
          })
        );
      }
    }
  }

  // Add V×h exceedance casualties (separate calculation)
  if (vhExceed > 0) {
    segmentCasualties.push(
      calculateSegmentCasualties({
        population: vhExceed,
        depthBin: 'above5m',
        velocityClass: 'v_high',
        durationModifier,
        isVhExceed: true,
      })
    );
  }

  // Sum all casualties
  const totalFatalities = sumCasualtyRanges(segmentCasualties);
  const totalInjuries = {
    low: totalFatalities.low * INJURY_MULTIPLIER,
    moderate: totalFatalities.moderate * INJURY_MULTIPLIER,
    high: totalFatalities.high * INJURY_MULTIPLIER,
  };

  // Classify risk levels (using moderate estimate)
  const fatalityRiskLevel = classifyRiskLevel(
    totalFatalities.moderate,
    total_affected_population
  );
  const injuryRiskLevel = classifyRiskLevel(
    totalInjuries.moderate,
    total_affected_population
  );

  // Identify key drivers
  const keyDrivers = identifyKeyDrivers({
    depthBins,
    totalAffected: total_affected_population,
    vhExceed,
    depthDurationCross,
  });

  return {
    fatalities: totalFatalities,
    injuries: totalInjuries,
    fatalityRiskLevel,
    injuryRiskLevel,
    keyDrivers,
  };
}

/**
 * Identify key drivers of casualty risk
 */
function identifyKeyDrivers({ depthBins, totalAffected, vhExceed, depthDurationCross }) {
  const drivers = [];

  // Calculate population in deep water (>3m)
  const deepPopulation = (depthBins['3-4m'] || 0) + (depthBins['4-5m'] || 0) + (depthBins['above5m'] || 0);
  const deepPercentage = totalAffected > 0 ? (deepPopulation / totalAffected) * 100 : 0;

  if (deepPercentage > 20) {
    drivers.push(`Large population in >3m depth zones (${deepPercentage.toFixed(0)}%)`);
  }

  // V×h exceedance
  if (vhExceed > 50000) {
    drivers.push(`V×h > 1.5 m²/s affecting ${Math.round(vhExceed).toLocaleString()} people`);
  }

  // Flash flood type (short duration dominant)
  let totalDurShort = 0;
  let totalPopulation = 0;
  Object.values(depthDurationCross).forEach((bin) => {
    totalDurShort += bin.d_short || 0;
    totalPopulation += (bin.d_short || 0) + (bin.d_medium || 0) + (bin.d_long || 0);
  });
  const shortPercentage = totalPopulation > 0 ? (totalDurShort / totalPopulation) * 100 : 0;

  if (shortPercentage > 50) {
    drivers.push('Flash-flood type event with rapid onset');
  }

  return drivers;
}

/**
 * Calculate casualties for a single district
 */
function calculateDistrictCasualties(districtData, scenarioVhExceed) {
  const {
    affected_population,
    depth_bins,
    depth_velocity_cross,
    depth_duration_cross,
    vh_exceed_population,
  } = districtData;

  if (!affected_population || affected_population === 0) {
    return {
      fatalities: { low: 0, moderate: 0, high: 0 },
      injuries: { low: 0, moderate: 0, high: 0 },
      fatalityRiskLevel: 'very_low',
      injuryRiskLevel: 'very_low',
    };
  }

  // Build scenario-like structure for calculation
  const scenarioLikeData = {
    total_affected_population: affected_population,
    vh_exceed_population: vh_exceed_population || 0,
  };

  // Map depth_bins and cross-tabs to flat columns
  if (depth_bins) {
    Object.entries(depth_bins).forEach(([key, value]) => {
      if (key.includes('15') || key.includes('100')) scenarioLikeData.depth_15_100cm = value;
      else if (key.includes('1-2')) scenarioLikeData.depth_1_2m = value;
      else if (key.includes('2-3')) scenarioLikeData.depth_2_3m = value;
      else if (key.includes('3-4')) scenarioLikeData.depth_3_4m = value;
      else if (key.includes('4-5')) scenarioLikeData.depth_4_5m = value;
      else if (key.includes('above')) scenarioLikeData.depth_above5m = value;
    });
  }

  if (depth_velocity_cross) {
    Object.entries(depth_velocity_cross).forEach(([depthKey, velocities]) => {
      // Convert depth key from JSONB format (1-2m) to column format (1_2m)
      const depthKeyNormalized = depthKey.replace('-', '_');
      Object.entries(velocities).forEach(([velKey, value]) => {
        // Remove v_ prefix from velKey if present (v_low -> low)
        const velShort = velKey.replace('v_', '');
        const colName = `vel_${velShort}_depth_${depthKeyNormalized}`;
        scenarioLikeData[colName] = value;
      });
    });
  }

  if (depth_duration_cross) {
    Object.entries(depth_duration_cross).forEach(([depthKey, durations]) => {
      // Convert depth key from JSONB format (1-2m) to column format (1_2m)
      const depthKeyNormalized = depthKey.replace('-', '_');
      Object.entries(durations).forEach(([durKey, value]) => {
        // Remove d_ prefix from durKey if present (d_short -> short)
        const durShort = durKey.replace('d_', '');
        const colName = `dur_${durShort}_depth_${depthKeyNormalized}`;
        scenarioLikeData[colName] = value;
      });
    });
  }

  return calculateScenarioCasualties(scenarioLikeData);
}

export default {
  calculateScenarioCasualties,
  calculateDistrictCasualties,
  classifyRiskLevel,
  MORTALITY_FACTORS,
  VH_EXCEED_MORTALITY,
  INJURY_MULTIPLIER,
};
